import express from 'express';
import { scrapeOracle } from './api/lib/scraper-service';

// Servidor Express para desarrollo local
const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/scrape', async (_req, res) => {
    try {
        const result = await scrapeOracle();
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`📡 API simulada corriendo en http://localhost:${port}`);
    console.log(`👉 El frontend (Vite) debe proxyar /api a este puerto.`);
});
