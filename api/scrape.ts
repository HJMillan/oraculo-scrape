import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

interface CanvaElement {
    "A?": string;
    A: number;    // Left (X)
    B: number;    // Top (Y)
    D: number;    // Width
    C: number;    // Height
    a?: {
        A?: Array<{
            A?: string;
        }>
    }
}

interface ScrapedItem {
    text: string;
    x: number;
    y: number;
    width: number;
    centerX: number;
    centerY: number;
}

interface LotterySection {
    title: string;
    date: string;
    items: { name: string; value: string; }[];
}


export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        const targetUrl = 'https://pob.my.canva.site/oraculo';

        const { data: html } = await axios.get(targetUrl);

        const bootstrapRegex = /window\['bootstrap'\]\s*=\s*JSON\.parse\('(.+?)'\);/;
        const match = html.match(bootstrapRegex);

        if (!match || !match[1]) {
            throw new Error('No se encontraron datos de bootstrap en el sitio.');
        }

        let rawJson = match[1];
        rawJson = rawJson.replace(/\\'/g, "'").replace(/\\\\/g, "\\");

        let canvaData;
        try {
            canvaData = JSON.parse(rawJson);
        } catch (e) {
            console.error("Error parsing bootstrap JSON", e);
            throw new Error("Error interno al procesar datos de Canva.");
        }

        // Type for the Page object
        interface CanvaPage {
            E?: CanvaElement[];
        }

        const pages: CanvaPage[] = canvaData?.page?.A?.A || [];

        if (!Array.isArray(pages) || pages.length === 0) {
            return response.status(200).json({ success: true, data: [], lastUpdated: new Date().toISOString() });
        }

        const sections: LotterySection[] = [];

        // Define known categories in display order
        const ORDERED_TITLES = ['LA PREVIA', 'LAS PRIMERAS', 'MATUTINA', 'VESPERTINA', 'NOCTURNA'];

        // Helper to normalize titles found in text
        const normalizeTitle = (text: string): string | null => {
            const upper = text.toUpperCase();
            if (upper.includes('PREVIA')) return 'LA PREVIA';
            if (upper.includes('PRIMERA')) return 'LAS PRIMERAS';
            if (upper.includes('MATUTINA')) return 'MATUTINA';
            if (upper.includes('VESPERTINA')) return 'VESPERTINA';
            if (upper.includes('NOCTURNA')) return 'NOCTURNA';
            return null;
        };

        pages.forEach((page, pageIndex) => {
            const elements = page.E || [];
            const pageItems: ScrapedItem[] = [];
            let pageTitle: string | null = null;
            let pageDate: string = '';

            elements.forEach(el => {
                if (el.a && el.a.A && Array.isArray(el.a.A)) {
                    const textContent = el.a.A
                        .map(segment => segment.A || '')
                        .join('')
                        .trim();

                    if (textContent && typeof el.A === 'number' && typeof el.B === 'number') {
                        // Check if this element is a Title
                        const inferredTitle = normalizeTitle(textContent);
                        if (inferredTitle) {
                            pageTitle = inferredTitle;
                        }

                        // Check for Date
                        const dateMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4})/);
                        if (dateMatch) {
                            pageDate = dateMatch[1];
                        }

                        pageItems.push({
                            text: textContent,
                            x: el.A,
                            y: el.B,
                            width: el.D || 0,
                            centerX: el.A + ((el.D || 0) / 2),
                            centerY: el.B + ((el.C || 0) / 2)
                        });
                    }
                }
            });

            if (pageTitle && pageItems.length > 0) {
                const sectionItems = extractPairs(pageItems);

                if (sectionItems.length > 0) {
                    sections.push({
                        title: pageTitle,
                        date: pageDate || new Date().toLocaleDateString('es-AR'),
                        items: sectionItems
                    });
                }
            }
        });

        // Sort sections according to fixed order
        sections.sort((a, b) => {
            return ORDERED_TITLES.indexOf(a.title) - ORDERED_TITLES.indexOf(b.title);
        });

        return response.status(200).json({
            success: true,
            data: sections,
            lastUpdated: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return response.status(500).json({
            success: false,
            error: 'Error al procesar datos del Oráculo',
        });
    }
}

function extractPairs(items: ScrapedItem[]): { name: string, value: string }[] {
    const headers: ScrapedItem[] = [];
    const values: ScrapedItem[] = [];
    const ignoredTerms = ['NOCTURNAS', 'VESPERTINAS', 'MATUTINAS', 'FECHA:', 'ORACULO', 'SEMANAL', 'DATOS', 'DATELLI', 'LA PREVIA', 'LAS PRIMERAS', 'LA PRIMERA', 'CIUDAD', 'PROVINCIA'];

    const sectionTitles = ['LA PREVIA', 'LAS PRIMERAS', 'MATUTINA', 'VESPERTINA', 'NOCTURNA', 'LAS NOCTURNAS', 'LAS VESPERTINAS', 'LAS MATUTINAS'];

    items.forEach(item => {
        const textUpper = item.text.toUpperCase();

        if (sectionTitles.some(t => textUpper.includes(t))) return;
        if (textUpper.includes('FECHA:')) return;

        // Value detection
        const isValue = /^[\d\.]+$/.test(item.text) || /^[\d]+$/.test(item.text) || item.text.includes('--');
        const isDate = item.text.match(/\d{2}\/\d{2}\/\d{4}/);

        if (isValue && !isDate) {
            values.push(item);
        } else if (!isDate) {
            const isTooLong = item.text.length > 30;
            if (!isTooLong && textUpper.length >= 2) {
                headers.push(item);
            }
        }
    });

    const results: { name: string, value: string, headerY: number, headerX: number }[] = [];

    values.forEach(val => {
        let bestHeader: ScrapedItem | null = null;
        let minXDist = Infinity;
        let bestYDist = Infinity;

        headers.forEach(header => {
            if (header.y < val.y) {
                const xDist = Math.abs(header.centerX - val.centerX);
                const yDist = Math.abs(header.centerY - val.centerY);

                if (xDist < 150 && yDist < 300) {
                    if (xDist < minXDist) {
                        minXDist = xDist;
                        bestYDist = yDist;
                        bestHeader = header;
                    } else if (Math.abs(xDist - minXDist) < 10) {
                        if (yDist < bestYDist) {
                            bestYDist = yDist;
                            bestHeader = header;
                        }
                    }
                }
            }
        });

        if (bestHeader) {
            let name = (bestHeader as ScrapedItem).text.replace(/\n/g, '').trim();

            if (name.toUpperCase().includes('CIUDAD')) {
                name = 'NACION';
            }

            results.push({
                name: name,
                value: val.text.replace(/\n/g, ''),
                headerX: (bestHeader as ScrapedItem).x,
                headerY: (bestHeader as ScrapedItem).y
            });
        }
    });

    results.sort((a, b) => {
        const yDiff = a.headerY - b.headerY;
        if (Math.abs(yDiff) > 10) return yDiff;
        return a.headerX - b.headerX;
    });

    return results.map(({ name, value }) => ({ name, value }));
}
