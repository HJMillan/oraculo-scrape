import type { CanvaBootstrapData } from './types.js';

/** Known GIF hashes from the Oráculo → plain text label for copy/share */
export const KNOWN_GIF_HASHES: Record<string, string> = {
    '8ca20cd00360e3647de412c3a9589d65': 'dato de datelli',
    '16561bd8b2221542e29e451b7dbc6264': 'dataudio',
    '8e0ebcbefac2c7ccb84860b646bf77dd': 'la Perla',
};

const GIF_BASE_URL = 'https://pob.my.canva.site/oraculo/';
const GIF_PATH_PREFIX = '_assets/video/';
const GIF_EXTENSION = '.gif';

/**
 * Builds a map of Canva asset IDs → full GIF URLs by inspecting
 * the parsed media catalog (instead of raw string searches).
 *
 * Strategy: iterate over media assets in the bootstrap data,
 * look for files whose URL contains a known GIF hash,
 * and map the asset ID to the full URL.
 */
export function buildGifAssetMap(
    data: CanvaBootstrapData,
    rawJsonFallback: string,
): Map<string, string> {
    const map = new Map<string, string>();
    const knownHashes = Object.keys(KNOWN_GIF_HASHES);

    // ── Strategy 1: Navigate the parsed object ──
    // Canva stores media assets under various paths; try the most common ones.
    const assets = findMediaAssets(data);

    for (const asset of assets) {
        if (!asset.id || !Array.isArray(asset.files)) continue;

        for (const file of asset.files) {
            if (!file.url) continue;

            for (const hash of knownHashes) {
                if (file.url.includes(`${GIF_PATH_PREFIX}${hash}${GIF_EXTENSION}`)) {
                    map.set(asset.id, `${GIF_BASE_URL}${GIF_PATH_PREFIX}${hash}${GIF_EXTENSION}`);
                }
            }
        }
    }

    // ── Strategy 2: Fallback to raw JSON if structured parsing missed any ──
    if (map.size < knownHashes.length) {
        for (const hash of knownHashes) {
            // Skip hashes we already resolved
            const fullUrl = `${GIF_BASE_URL}${GIF_PATH_PREFIX}${hash}${GIF_EXTENSION}`;
            const alreadyMapped = [...map.values()].includes(fullUrl);
            if (alreadyMapped) continue;

            const gifUrlFragment = `${GIF_PATH_PREFIX}${hash}${GIF_EXTENSION}`;
            const idx = rawJsonFallback.indexOf(gifUrlFragment);
            if (idx === -1) continue;

            const searchStart = Math.max(0, idx - 500);
            const context = rawJsonFallback.substring(searchStart, idx);
            const idMatches = context.match(/"id":"([^"]+)"/g);

            if (idMatches && idMatches.length > 0) {
                const lastId = idMatches[idMatches.length - 1];
                const idValue = lastId.match(/"id":"([^"]+)"/);
                if (idValue) {
                    map.set(idValue[1], fullUrl);
                }
            }
        }
    }

    return map;
}

/**
 * Attempts to locate the media assets array from the Canva bootstrap data.
 * The structure can vary; we try known paths.
 */
function findMediaAssets(data: CanvaBootstrapData): Array<{ id: string; files: Array<{ url: string }> }> {
    // Primary path: data.asset.A (array of media assets)
    if (data.asset?.A && Array.isArray(data.asset.A)) {
        return data.asset.A;
    }

    // Walk top-level keys looking for arrays that contain objects with `id` + `files`
    for (const key of Object.keys(data)) {
        const val = (data as Record<string, unknown>)[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            for (const subKey of Object.keys(val as Record<string, unknown>)) {
                const arr = (val as Record<string, unknown>)[subKey];
                if (Array.isArray(arr) && arr.length > 0 && arr[0]?.id && arr[0]?.files) {
                    return arr;
                }
            }
        }
    }

    return [];
}
