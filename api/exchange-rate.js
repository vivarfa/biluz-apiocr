// api/exchange-rate.js (VERSIÓN FINAL CON BÚSQUEDA INTELIGENTE)
const axios = require('axios');

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await fn(req, res);
};

const handler = async (req, res) => {
    // Obtenemos la fecha de la consulta. Si no viene, usamos la de hoy.
    let requestedDate = req.query.date ? new Date(req.query.date.replace(/-/g, '/')) : new Date();

    const token = process.env.RUC_API_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'El token de la API no está configurado.' });
    }

    // Bucle para buscar hacia atrás hasta 7 días.
    for (let i = 0; i < 7; i++) {
        // Formateamos la fecha a YYYY-MM-DD
        const dateToQuery = requestedDate.toLocaleDateString('en-CA');
        const url = `https://api.apis.net.pe/v2/sunat/tipo-cambio?date=${dateToQuery}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Referer': 'https://apis.net.pe/consulta-ruc-api',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Si la respuesta tiene los campos 'compra' y 'venta', ¡la encontramos!
            if (response.data && response.data.compra && response.data.venta) {
                // Devolvemos los datos y salimos de la función.
                return res.status(200).json(response.data);
            }
            
            // Si no, restamos un día y el bucle vuelve a intentarlo.
            requestedDate.setDate(requestedDate.getDate() - 1);

        } catch (error) {
            // Si la API da un error (ej: 404), restamos un día y continuamos el bucle.
            console.log(`No se encontró T/C para ${dateToQuery}, intentando día anterior.`);
            requestedDate.setDate(requestedDate.getDate() - 1);
        }
    }
    
    // Si después de 7 intentos no encontramos nada, devolvemos un error definitivo.
    res.status(404).json({ error: `No se encontró tipo de cambio en los últimos 7 días.` });
};

module.exports = allowCors(handler);