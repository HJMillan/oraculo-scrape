import type { CanvaPage, ScrapedItem, GifElement, LotteryItem, LotterySection } from './types.js';

// ─── Constants ───

const MAX_X_DISTANCE = 150;
const MAX_Y_DISTANCE = 300;
const Y_SORT_THRESHOLD = 10;
const GIF_X_THRESHOLD = 60;

const SECTION_TITLES = [
    'LA PREVIA', 'LAS PRIMERAS', 'MATUTINA', 'VESPERTINA', 'NOCTURNA',
    'LAS NOCTURNAS', 'LAS VESPERTINAS', 'LAS MATUTINAS',
];

/** Display order for final output */
export const ORDERED_TITLES = ['NOCTURNA', 'LA PREVIA', 'LAS PRIMERAS', 'MATUTINA', 'VESPERTINA'];

// ─── Title normalization ───

function normalizeTitle(text: string): string | null {
    const upper = text.toUpperCase();
    if (upper.includes('PREVIA')) return 'LA PREVIA';
    if (upper.includes('PRIMERA')) return 'LAS PRIMERAS';
    if (upper.includes('MATUTINA')) return 'MATUTINA';
    if (upper.includes('VESPERTINA')) return 'VESPERTINA';
    if (upper.includes('NOCTURNA')) return 'NOCTURNA';
    return null;
}

// ─── Page processing ───

/**
 * Processes all Canva pages and returns sorted lottery sections.
 */
export function extractSectionsFromPages(
    pages: CanvaPage[],
    gifAssetMap: Map<string, string>,
): LotterySection[] {
    const sections: LotterySection[] = [];

    for (const page of pages) {
        const elements = page.E || [];
        const pageItems: ScrapedItem[] = [];
        const pageGifs: GifElement[] = [];
        let pageTitle: string | null = null;
        let pageDate = '';

        for (const el of elements) {
            // ── Detect GIF elements via asset ID reference ──
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
            if (el.a?.A && Array.isArray(el.a.A)) {
                const textContent = el.a.A
                    .map(segment => segment.A || '')
                    .join('')
                    .trim();

                if (textContent && typeof el.A === 'number' && typeof el.B === 'number') {
                    const inferredTitle = normalizeTitle(textContent);
                    if (inferredTitle) pageTitle = inferredTitle;

                    const dateMatch = textContent.match(/(\d{2}\/\d{2}\/\d{4})/);
                    if (dateMatch) pageDate = dateMatch[1];

                    pageItems.push({
                        text: textContent,
                        x: el.A,
                        y: el.B,
                        width: el.D || 0,
                        centerX: el.A + ((el.D || 0) / 2),
                        centerY: el.B + ((el.C || 0) / 2),
                    });
                }
            }
        }

        if (pageTitle && pageItems.length > 0) {
            const sectionItems = extractPairs(pageItems, pageGifs);
            if (sectionItems.length > 0) {
                sections.push({
                    title: pageTitle,
                    date: pageDate || new Date().toLocaleDateString('es-AR'),
                    items: sectionItems,
                });
            }
        }
    }

    // Sort by fixed display order
    sections.sort((a, b) =>
        ORDERED_TITLES.indexOf(a.title) - ORDERED_TITLES.indexOf(b.title),
    );

    return sections;
}

// ─── Pair extraction (name ↔ value matching by coordinates) ───

function extractPairs(items: ScrapedItem[], gifs: GifElement[]): LotteryItem[] {
    const headers: ScrapedItem[] = [];
    const values: ScrapedItem[] = [];

    for (const item of items) {
        const textUpper = item.text.toUpperCase();

        if (SECTION_TITLES.some(t => textUpper.includes(t))) continue;
        if (textUpper.includes('FECHA:')) continue;

        const isValue = /^[\d.]+$/.test(item.text) || item.text.includes('--');
        const isDate = /\d{2}\/\d{2}\/\d{4}/.test(item.text);

        if (isValue && !isDate) {
            values.push(item);
        } else if (!isDate && item.text.length <= 30 && textUpper.length >= 2) {
            headers.push(item);
        }
    }

    // ── GIF-first matching: each GIF finds its closest value by X coordinate ──
    const gifForValue = new Map<number, string>();

    for (const gif of gifs) {
        let bestValIdx = -1;
        let bestXDist = GIF_X_THRESHOLD;

        values.forEach((val, vi) => {
            const xDist = Math.abs(gif.centerX - val.centerX);
            if (xDist < bestXDist) {
                bestXDist = xDist;
                bestValIdx = vi;
            }
        });

        if (bestValIdx >= 0 && !gifForValue.has(bestValIdx)) {
            gifForValue.set(bestValIdx, gif.gifUrl);
        }
    }

    // ── Match each value with its closest header above ──
    const results: Array<LotteryItem & { headerY: number; headerX: number }> = [];

    values.forEach((val, vi) => {
        let bestHeader: ScrapedItem | null = null;
        let minXDist = Infinity;
        let bestYDist = Infinity;

        for (const header of headers) {
            if (header.y >= val.y) continue;

            const xDist = Math.abs(header.centerX - val.centerX);
            const yDist = Math.abs(header.centerY - val.centerY);

            if (xDist < MAX_X_DISTANCE && yDist < MAX_Y_DISTANCE) {
                if (xDist < minXDist) {
                    minXDist = xDist;
                    bestYDist = yDist;
                    bestHeader = header;
                } else if (Math.abs(xDist - minXDist) < Y_SORT_THRESHOLD && yDist < bestYDist) {
                    bestYDist = yDist;
                    bestHeader = header;
                }
            }
        }

        if (bestHeader) {
            const item: LotteryItem & { headerY: number; headerX: number } = {
                name: bestHeader.text.replace(/\n/g, '').trim(),
                value: val.text.replace(/\n/g, ''),
                headerY: bestHeader.y,
                headerX: bestHeader.x,
            };

            const gifUrl = gifForValue.get(vi);
            if (gifUrl) item.gifUrl = gifUrl;

            results.push(item);
        }
    });

    // Sort by position: top-to-bottom, left-to-right
    results.sort((a, b) => {
        const yDiff = a.headerY - b.headerY;
        if (Math.abs(yDiff) > Y_SORT_THRESHOLD) return yDiff;
        return a.headerX - b.headerX;
    });

    return results.map(({ name, value, gifUrl }) => {
        const item: LotteryItem = { name, value };
        if (gifUrl) item.gifUrl = gifUrl;
        return item;
    });
}
