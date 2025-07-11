// api/query-api.js (VERSIÓN FINAL Y ROBUSTA)
const axios = require('axios');

// El helper de CORS no cambia...
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await fn(req, res);
};

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    const { numeros } = req.body;
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de números.' });
    }

    try {
        const resultados = [];
        const token = process.env.APISPERU_TOKEN; // Usamos el nuevo token
        if (!token) {
            return res.status(500).json({ error: 'El token de APISPERU no está configurado.' });
        }

        for (const numero of numeros) {
            let url;
            let tipo;

            if (numero.length === 11) {
                url = `https://dniruc.apisperu.com/api/v1/ruc/${numero}?token=${token}`;
                tipo = 'RUC';
            } else if (numero.length === 8) {
                url = `https://dniruc.apisperu.com/api/v1/dni/${numero}?token=${token}`;
                tipo = 'DNI';
            } else {
                resultados.push({ tipo: 'Error', numero, nombre: 'Número no válido.', error: true });
                continue;
            }

            try {
                const response = await axios.get(url);
                // Adaptamos la respuesta de la nueva API a nuestro formato
                if (response.data.success === false) {
                    throw new Error(response.data.message || 'No encontrado');
                }
                resultados.push({ tipo, ...response.data });
            } catch (apiError) {
                console.error(`Error consultando ${numero}:`, apiError.response ? apiError.response.data : apiError.message);
                resultados.push({ tipo, numero, nombre: `${tipo} no encontrado o error en consulta.`, error: true });
            }
        }
        
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Error en el manejador principal:", error);
        res.status(500).json({ error: 'Falló el proceso en el servidor.', details: error.message });
    }
};

module.exports = allowCors(handler);
