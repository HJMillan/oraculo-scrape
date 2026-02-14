import type { ScrapingResponse } from './types.js';
import { fetchAndParseCanvaData, validateAndExtractPages } from './canva-parser.js';
import { buildGifAssetMap } from './gif-asset-mapper.js';
import { extractSectionsFromPages } from './element-extractor.js';

const TARGET_URL = 'https://pob.my.canva.site/oraculo';

/**
 * Framework-agnostic scraping service.
 * Returns a typed ScrapingResponse — no Express/Vercel coupling.
 */
export async function scrapeOracle(): Promise<ScrapingResponse> {
    const { data, rawJson } = await fetchAndParseCanvaData(TARGET_URL);

    const pages = validateAndExtractPages(data);

    if (!pages || pages.length === 0) {
        return {
            success: true,
            data: [],
            lastUpdated: new Date().toISOString(),
            warning: 'Estructura de Canva no reconocida o sin páginas.',
        };
    }

    const gifAssetMap = buildGifAssetMap(data, rawJson);
    const sections = extractSectionsFromPages(pages, gifAssetMap);

    return {
        success: true,
        data: sections,
        lastUpdated: new Date().toISOString(),
    };
}
