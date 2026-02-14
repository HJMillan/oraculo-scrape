import type { CanvaBootstrapData } from './types';

/**
 * Multiple regex patterns for the Canva bootstrap payload.
 * Canva may change quoting or minification, so we try several patterns.
 */
const BOOTSTRAP_PATTERNS: RegExp[] = [
    /window\['bootstrap'\]\s*=\s*JSON\.parse\('(.+?)'\);/,
    /window\["bootstrap"\]\s*=\s*JSON\.parse\("(.+?)"\);/,
    /window\.bootstrap\s*=\s*JSON\.parse\('(.+?)'\);/,
    /window\.bootstrap\s*=\s*JSON\.parse\("(.+?)"\);/,
];

interface FetchOptions {
    timeoutMs?: number;
    retries?: number;
}

/**
 * Fetches the Canva site HTML and extracts the bootstrap JSON payload.
 * Includes retry logic and per-request timeout for resilience.
 *
 * Returns the parsed data object and the raw JSON string (needed by gif mapper).
 */
export async function fetchAndParseCanvaData(
    targetUrl: string,
    options?: FetchOptions,
): Promise<{ data: CanvaBootstrapData; rawJson: string }> {
    const { timeoutMs = 15_000, retries = 2 } = options ?? {};

    let lastError: Error = new Error('Fetch failed');

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            const res = await fetch(targetUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const html = await res.text();

            // Try each regex pattern until one matches
            let rawCaptured: string | null = null;
            for (const pattern of BOOTSTRAP_PATTERNS) {
                const match = html.match(pattern);
                if (match?.[1]) {
                    rawCaptured = match[1];
                    break;
                }
            }

            if (!rawCaptured) {
                throw new Error('No se encontraron datos de bootstrap en el sitio.');
            }

            const rawJson = rawCaptured
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, '\\');

            let data: CanvaBootstrapData;
            try {
                data = JSON.parse(rawJson);
            } catch {
                throw new Error('Error interno al procesar datos de Canva.');
            }

            return { data, rawJson };
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));

            // Only retry on transient errors, not on parsing failures
            const isTransient = lastError.message.startsWith('HTTP')
                || lastError.name === 'AbortError'
                || lastError.message.includes('fetch');

            if (!isTransient || attempt >= retries) break;

            // Exponential back-off: 1s, 2s, ...
            const delay = 1000 * (attempt + 1);
            console.warn(`[canva-parser] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    throw lastError;
}

/**
 * Validates that the Canva bootstrap data has the expected page structure.
 * Returns the pages array or null if the structure is unrecognized.
 */
export function validateAndExtractPages(data: CanvaBootstrapData) {
    const pages = data?.page?.A?.A;

    if (!pages || !Array.isArray(pages)) {
        return null;
    }

    return pages;
}
