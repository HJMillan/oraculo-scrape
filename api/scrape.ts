import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CanvaElement {
    "A?": string;
    A: number;    // Left (X)
    B: number;    // Top (Y)
    D: number;    // Width
    C: number;    // Height
    a?: {
        A?: Array<{
            A?: string;
        }>;
        I?: {
            A?: string;  // Asset/media ID reference
        };
    }
}

interface CanvaPage {
    E?: CanvaElement[];
}

interface MediaFile {
    url: string;
    width: number;
    height: number;
    container: string;
    watermarked: boolean;
}

interface MediaAsset {
    id: string;
    files: MediaFile[];
    contentType?: string;
}

interface ScrapedItem {
    text: string;
    x: number;
    y: number;
    width: number;
    centerX: number;
    centerY: number;
}

interface GifElement {
    gifUrl: string;
    x: number;
    y: number;
    centerX: number;
    centerY: number;
}

interface LotterySection {
    title: string;
    date: string;
    items: { name: string; value: string; gifUrl?: string }[];
}

// Hashes conocidos de GIFs del Oráculo → texto plano para copiar
const KNOWN_GIF_HASHES: Record<string, string> = {
    '8ca20cd00360e3647de412c3a9589d65': 'dato de datelli',
    '16561bd8b2221542e29e451b7dbc6264': 'dataudio',
    '8e0ebcbefac2c7ccb84860b646bf77dd': 'la Perla',
};

const GIF_BASE_URL = 'https://pob.my.canva.site/oraculo/';


export default async function handler(request: VercelRequest, response: VercelResponse) {
    try {
        const targetUrl = 'https://pob.my.canva.site/oraculo';

        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();

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
        } catch {
            throw new Error("Error interno al procesar datos de Canva.");
        }

        // ── Build asset ID → GIF URL map from Canva's media catalog ──
        const gifAssetMap = buildGifAssetMap(rawJson);

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

        pages.forEach((page) => {
            const elements = page.E || [];
            const pageItems: ScrapedItem[] = [];
            const pageGifs: GifElement[] = [];
            let pageTitle: string | null = null;
            let pageDate: string = '';

            elements.forEach(el => {
                // ── Detect GIF elements via asset ID reference (el.a.I.A) ──
                const assetId = el.a?.I?.A;
                if (assetId && gifAssetMap.has(assetId)) {
                    pageGifs.push({
                        gifUrl: gifAssetMap.get(assetId)!,
                        x: el.A,
                        y: el.B,
                        centerX: el.A + ((el.D || 0) / 2),
                        centerY: el.B + ((el.C || 0) / 2),
                    });
                }

                // ── Process text elements ──
                if (el.a && el.a.A && Array.isArray(el.a.A)) {
                    const textContent = (el.a.A as Array<{ A?: string }>)
                        .map(segment => segment.A || '')
                        .join('')
                        .trim();

                    if (textContent && typeof el.A === 'number' && typeof el.B === 'number') {
                        const inferredTitle = normalizeTitle(textContent);
                        if (inferredTitle) {
                            pageTitle = inferredTitle;
                        }

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
                const sectionItems = extractPairs(pageItems, pageGifs);

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

/**
 * Searches the raw JSON string for known GIF hashes and extracts
 * the corresponding Canva asset IDs to build a map: assetId → full GIF URL.
 *
 * The Canva data structure stores media like:
 * { "id": "VAEwPkWDfFg", "files": [{ "url": "_assets/video/HASH.gif", ... }] }
 *
 * Page elements reference these via el.a.I.A = assetId.
 */
function buildGifAssetMap(rawJson: string): Map<string, string> {
    const map = new Map<string, string>();

    for (const hash of Object.keys(KNOWN_GIF_HASHES)) {
        // Find the GIF URL in the raw JSON
        const gifUrlFragment = `_assets/video/${hash}.gif`;
        const idx = rawJson.indexOf(gifUrlFragment);
        if (idx === -1) continue;

        // Search backwards from the GIF URL to find the "id" field
        // The structure is: {"id":"ASSET_ID","files":[{"url":"_assets/video/HASH.gif",...}]}
        const searchStart = Math.max(0, idx - 500);
        const context = rawJson.substring(searchStart, idx);

        // Find the asset ID: look for "id":"..." pattern before the URL
        const idMatch = context.match(/"id":"([^"]+)"/g);
        if (idMatch && idMatch.length > 0) {
            // Take the last match (closest to the GIF URL)
            const lastId = idMatch[idMatch.length - 1];
            const idValue = lastId.match(/"id":"([^"]+)"/);
            if (idValue) {
                const fullUrl = `${GIF_BASE_URL}${gifUrlFragment}`;
                map.set(idValue[1], fullUrl);
            }
        }
    }

    return map;
}


const MAX_X_DISTANCE = 150;
const MAX_Y_DISTANCE = 300;
const Y_SORT_THRESHOLD = 10;
const GIF_X_THRESHOLD = 60;

function extractPairs(items: ScrapedItem[], gifs: GifElement[]): { name: string, value: string, gifUrl?: string }[] {
    const headers: ScrapedItem[] = [];
    const values: ScrapedItem[] = [];

    const sectionTitles = ['LA PREVIA', 'LAS PRIMERAS', 'MATUTINA', 'VESPERTINA', 'NOCTURNA', 'LAS NOCTURNAS', 'LAS VESPERTINAS', 'LAS MATUTINAS'];

    items.forEach(item => {
        const textUpper = item.text.toUpperCase();

        if (sectionTitles.some(t => textUpper.includes(t))) return;
        if (textUpper.includes('FECHA:')) return;

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

    // ── GIF-first matching: each GIF finds its closest value by X coordinate ──
    // GIFs sit below values in the same column, so X proximity is the key indicator.
    const gifForValue = new Map<number, string>(); // valueIndex → gifUrl

    gifs.forEach(gif => {
        let bestValIdx = -1;
        let bestXDist = GIF_X_THRESHOLD;

        values.forEach((val, vi) => {
            const xDist = Math.abs(gif.centerX - val.centerX);
            if (xDist < bestXDist) {
                bestXDist = xDist;
                bestValIdx = vi;
            }
        });

        if (bestValIdx >= 0) {
            // If this value already has a GIF, keep the one with smallest X distance
            if (!gifForValue.has(bestValIdx)) {
                gifForValue.set(bestValIdx, gif.gifUrl);
            }
        }
    });

    const results: { name: string, value: string, gifUrl?: string, headerY: number, headerX: number }[] = [];

    values.forEach((val, vi) => {
        let bestHeader: ScrapedItem | null = null;
        let minXDist = Infinity;
        let bestYDist = Infinity;

        headers.forEach(header => {
            if (header.y < val.y) {
                const xDist = Math.abs(header.centerX - val.centerX);
                const yDist = Math.abs(header.centerY - val.centerY);

                if (xDist < MAX_X_DISTANCE && yDist < MAX_Y_DISTANCE) {
                    if (xDist < minXDist) {
                        minXDist = xDist;
                        bestYDist = yDist;
                        bestHeader = header;
                    } else if (Math.abs(xDist - minXDist) < Y_SORT_THRESHOLD) {
                        if (yDist < bestYDist) {
                            bestYDist = yDist;
                            bestHeader = header;
                        }
                    }
                }
            }
        });

        if (bestHeader) {
            const matched: ScrapedItem = bestHeader;
            let name = matched.text.replace(/\n/g, '').trim();

            results.push({
                name: name,
                value: val.text.replace(/\n/g, ''),
                gifUrl: gifForValue.get(vi),
                headerX: matched.x,
                headerY: matched.y
            });
        }
    });

    results.sort((a, b) => {
        const yDiff = a.headerY - b.headerY;
        if (Math.abs(yDiff) > Y_SORT_THRESHOLD) return yDiff;
        return a.headerX - b.headerX;
    });

    return results.map(({ name, value, gifUrl }) => {
        const item: { name: string; value: string; gifUrl?: string } = { name, value };
        if (gifUrl) item.gifUrl = gifUrl;
        return item;
    });
}
