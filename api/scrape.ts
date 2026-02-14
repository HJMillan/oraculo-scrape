import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeOracle } from './lib/scraper-service';

export default async function handler(_request: VercelRequest, response: VercelResponse) {
    try {
        const result = await scrapeOracle();
        return response.status(200).json(result);
    } catch (error) {
        console.error('Scraping error:', error);
        return response.status(500).json({
            success: false,
            error: 'Error al procesar datos del Oráculo',
        });
    }
}
