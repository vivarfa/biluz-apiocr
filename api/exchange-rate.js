// api/exchange-rate.js
const axios = require('axios');

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); // Ahora permitimos GET
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await fn(req, res);
};

const handler = async (req, res) => {
    // Obtenemos la fecha de los parámetros de la URL, ej: ?date=2023-04-15
    // Si no se provee fecha, usamos la de hoy en formato peruano.
    const date = req.query.date || new Date().toLocaleDateString('en-CA'); // 'en-CA' da el formato YYYY-MM-DD

    try {
        const token = process.env.RUC_API_TOKEN; // Usamos el mismo token que para RUC/DNI
        if (!token) {
            return res.status(500).json({ error: 'El token de la API no está configurado.' });
        }

        const url = `https://api.apis.net.pe/v2/sunat/tipo-cambio?date=${date}`;

        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://apis.net.pe/consulta-ruc-api',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.error) {
             throw new Error(response.data.error);
        }
        
        // Si todo va bien, devolvemos los datos del tipo de cambio
        res.status(200).json(response.data);

    } catch (error) {
        const errorMsg = error.response ? error.response.data.message : error.message;
        console.error(`Error consultando tipo de cambio para ${date}:`, errorMsg);
        res.status(404).json({ error: `No se encontró tipo de cambio para la fecha ${date}.` });
    }
};

module.exports = allowCors(handler);