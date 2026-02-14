import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeOracle } from './_lib/scraper-service.js';

export default async function handler(_request: VercelRequest, response: VercelResponse) {
    try {
        const result = await scrapeOracle();
        return response.status(200).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Scraping error:', message, error);
        return response.status(500).json({
            success: false,
            error: `Error al procesar datos del Oráculo: ${message}`,
        });
    }
}
