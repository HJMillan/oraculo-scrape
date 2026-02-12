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

export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        const targetUrl = 'https://pob.my.canva.site/oraculo';

        // 1. Obtener HTML
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
            // ... other properties
        }

        const pages: CanvaPage[] = canvaData?.page?.A?.A || [];

        if (!Array.isArray(pages) || pages.length === 0) {
            console.log('No pages found in canvaData.page.A.A');
            return response.status(200).json({ success: true, data: [], lastUpdated: new Date().toISOString() });
        }

        const items: ScrapedItem[] = [];

        // Height offset per page to keep vertical order when merging all elements
        // Assuming each page is roughly 2000px high (arbitrary, just needs to be large enough)
        const PAGE_HEIGHT_OFFSET = 2000;

        pages.forEach((page, pageIndex) => {
            const elements = page.E || [];

            elements.forEach(el => {
                if (el.a && el.a.A && Array.isArray(el.a.A)) {
                    const textContent = el.a.A
                        .map(segment => segment.A || '')
                        .join('')
                        .trim();

                    // Ensure we have valid coordinates
                    if (textContent && typeof el.A === 'number' && typeof el.B === 'number') {
                        // Apply offset to Y based on page index
                        const absoluteY = el.B + (pageIndex * PAGE_HEIGHT_OFFSET);
                        const width = el.D || 0;
                        const height = el.C || 0;

                        items.push({
                            text: textContent,
                            x: el.A,
                            y: absoluteY, // Use absolute Y
                            width: width,
                            centerX: el.A + (width / 2),
                            centerY: absoluteY + (height / 2)
                        });
                    }
                }
            });
        });

        const headers: ScrapedItem[] = [];
        const values: ScrapedItem[] = [];
        // Palabras clave a ignorar como Headers
        const ignoredTerms = ['NOCTURNAS', 'VESPERTINAS', 'MATUTINAS', 'FECHA:', 'ORACULO', 'SEMANAL', 'DATOS', 'DATELLI'];

        items.forEach(item => {
            const textUpper = item.text.toUpperCase();

            // Es un valor si es numérico o "--"
            const isValue = /^[\d\.]+$/.test(item.text) || /^[\d]+$/.test(item.text) || item.text.includes('--');
            const isDate = item.text.match(/\d{2}\/\d{2}\/\d{4}/);

            if (isValue && !isDate) {
                values.push(item);
            } else if (!isDate) {
                const isIgnored = ignoredTerms.some(term => textUpper.includes(term));
                const isTooLong = item.text.length > 30;

                if (!isIgnored && !isTooLong && textUpper.length >= 2) {
                    headers.push(item);
                }
            }
        });

        // Estructura temporal para guardar coords de ordenamiento
        const tempResults: { name: string, value: string, headerY: number, headerX: number }[] = [];

        values.forEach(val => {
            let bestHeader: ScrapedItem | null = null;
            let minXDist = Infinity;
            let bestYDist = Infinity; // Para desempatar si hay dudas, preferimos el más cercano verticalmente tambien

            headers.forEach(header => {
                // El header debe estar arriba del valor
                if (header.y < val.y) {
                    const xDist = Math.abs(header.centerX - val.centerX);
                    const yDist = Math.abs(header.centerY - val.centerY);

                    // Criterios de cercanía:
                    // 1. Alineación vertical (X) decente (< 100px)
                    // 2. Distancia vertical (Y) no exagerada (< 300px)
                    if (xDist < 120 && yDist < 300) {
                        // Buscamos el que tenga menor distancia X (más alineado)
                        // Si la distancia X es similar, priorizamos el más cercano en Y (el header inmediatamente arriba)

                        if (xDist < minXDist) {
                            minXDist = xDist;
                            bestYDist = yDist;
                            bestHeader = header;
                        } else if (Math.abs(xDist - minXDist) < 10) {
                            // Si la diferencia de alineación X es despreciable, gana el que esté más cerca en Y
                            if (yDist < bestYDist) {
                                bestYDist = yDist;
                                bestHeader = header;
                            }
                        }
                    }
                }
            });

            if (bestHeader) {
                tempResults.push({
                    name: (bestHeader as ScrapedItem).text.replace(/\n/g, ''),
                    value: val.text.replace(/\n/g, ''),
                    headerX: (bestHeader as ScrapedItem).x,
                    headerY: (bestHeader as ScrapedItem).y
                });
            }
        });

        // Ordenar por filas (Y) y luego columnas (X)
        tempResults.sort((a, b) => {
            const yDiff = a.headerY - b.headerY;
            // Tolerancia de 10px para considerar misma fila
            if (Math.abs(yDiff) > 10) return yDiff;
            return a.headerX - b.headerX;
        });

        // Limpiar para output final
        const finalData = tempResults.map(({ name, value }) => ({ name, value }));

        return response.status(200).json({
            success: true,
            data: finalData,
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
