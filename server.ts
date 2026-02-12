import express from 'express';
import handler from './api/scrape';

// Servidor Express para desarrollo local
const app = express();
const port = 3000;

app.use(express.json());

// Adaptador simple para emular Vercel Request/Response en Express
app.get('/api/scrape', async (req, res) => {
    try {
        // @ts-ignore - La firma es compatible para este uso simple
        await handler(req, res);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`📡 API simulada corriendo en http://localhost:${port}`);
    console.log(`👉 El frontend (Vite) debe proxyar /api a este puerto.`);
});
