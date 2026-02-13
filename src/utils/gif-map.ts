/**
 * Mapa de GIFs conocidos: hash del filename → texto para copiar/WhatsApp.
 * Los 3 GIFs son fijos y provienen de la página Canva del Oráculo.
 */

const GIF_BASE_URL = 'https://pob.my.canva.site/oraculo/_assets/video/';

const GIF_TEXT_MAP: Record<string, string> = {
    '8ca20cd00360e3647de412c3a9589d65': 'Dato de datelli',
    '16561bd8b2221542e29e451b7dbc6264': 'Dataudio',
    '8e0ebcbefac2c7ccb84860b646bf77dd': 'la Perla',
};

/** Todos los hashes conocidos para detección en el scraper */
export const KNOWN_GIF_HASHES = Object.keys(GIF_TEXT_MAP);

/** Verifica si un string es una URL de GIF conocida */
export function isGifUrl(value: string): boolean {
    return value.startsWith('http') && value.endsWith('.gif');
}

/** Dado un hash de GIF, devuelve la URL completa */
export function getGifFullUrl(hash: string): string {
    return `${GIF_BASE_URL}${hash}.gif`;
}

/** Dado una URL de GIF, extrae el texto plano correspondiente */
export function getGifTextLabel(gifUrl: string): string {
    const hash = gifUrl.split('/').pop()?.replace('.gif', '') ?? '';
    return GIF_TEXT_MAP[hash] ?? '';
}
