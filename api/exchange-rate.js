// api/exchange-rate.js (VERSIÓN CORREGIDA - SIN BUCLE)
const axios = require('axios');

// Función para habilitar CORS (Cross-Origin Resource Sharing)
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await fn(req, res);
};

const handler = async (req, res) => {
    // Obtenemos la fecha de la consulta. Si no viene, usamos la de hoy.
    const dateToQuery = req.query.date ? new Date(req.query.date.replace(/-/g, '/')).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');

    const token = process.env.RUC_API_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'El token de la API no está configurado en el servidor.' });
    }

    const url = `https://api.apis.net.pe/v2/sunat/tipo-cambio?date=${dateToQuery}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://apis.net.pe/consulta-ruc-api',
                'Authorization': `Bearer ${token}`
            }
        });

        // Si la respuesta de la API externa tiene los datos, los devolvemos.
        if (response.data && response.data.compra && response.data.venta) {
            return res.status(200).json(response.data);
        } else {
            // Si la respuesta no tiene el formato esperado, devolvemos un error.
            throw new Error('La respuesta de la API no contiene los datos de compra/venta.');
        }

    } catch (error) {
        // Si axios.get falla (ej. error 404 de apis.net.pe), capturamos el error.
        console.error(`Error al consultar ${dateToQuery}:`, error.response ? error.response.data : error.message);
        
        // Devolvemos un error claro al frontend.
        res.status(404).json({ error: `No se encontró tipo de cambio para la fecha ${dateToQuery}.` });
    }
};

module.exports = allowCors(handler);