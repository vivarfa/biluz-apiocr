    // /api/tc.js en Vercel (ACTUALIZADO)
    export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        let privateUrl = process.env.API_TC_URL; // URL base
        const { fecha } = req.query; // Captura el parámetro de fecha: ?fecha=YYYY-MM-DD

        if (fecha) {
            // Si se proporciona una fecha, la añadimos a la URL
            privateUrl += `/?fecha=${fecha}`;
        }

        const apiResponse = await fetch(privateUrl);
        if (!apiResponse.ok) throw new Error(`Error en API de Cloud Run: ${apiResponse.status}`);
        const data = await apiResponse.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor TC' });
    }
    }