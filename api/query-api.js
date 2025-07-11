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
    // La validación de entrada no cambia...
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { numeros } = req.body;
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de números (RUC/DNI).' });
    }

    try {
        const resultados = [];
        const token = process.env.RUC_API_TOKEN;
        // ¡NUEVO! Verificación de que el token existe.
        if (!token) {
            // Si no hemos configurado el token en Vercel, devolvemos un error claro.
            return res.status(500).json({ error: 'El token de la API no está configurado en el servidor.' });
        }

        for (const numero of numeros) {
            let url;
            let tipo;
            
            // La lógica para decidir si es RUC o DNI no cambia...
            if (numero.length === 11) {
                url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${numero}`;
                tipo = 'RUC';
            } else if (numero.length === 8) {
                url = `https://api.apis.net.pe/v2/reniec/dni?numero=${numero}`;
                tipo = 'DNI';
            } else {
                resultados.push({ tipo: 'Error', numero, nombre: 'Número no válido.', error: true });
                continue;
            }

            // ¡NUEVO Y MEJORADO! Manejo de errores para cada consulta individual.
            try {
                const response = await axios.get(url, {
                    headers: {
                        'Referer': 'https://apis.net.pe/consulta-ruc-api',
                        'Authorization': `Bearer ${token}`
                    }
                });
                // Si la API responde bien, añadimos los datos.
                // Renombramos 'nombre' a 'razonSocial' para consistencia con la v2 de la API de RUC.
                resultados.push({ tipo, ...(response.data.nombre ? { razonSocial: response.data.nombre } : response.data) });
            } catch (apiError) {
                // Si la API de apis.net.pe devuelve un error (ej: 404, 422, 401 por token inválido)
                // lo capturamos aquí y creamos un objeto de error amigable.
                console.error(`Error consultando ${numero}:`, apiError.response ? apiError.response.data : apiError.message);
                resultados.push({ tipo, numero, nombre: `${tipo} no encontrado o error en consulta.`, error: true });
            }
        }
        
        // Enviamos siempre una respuesta JSON válida.
        res.status(200).json(resultados);

    } catch (error) {
        // Este es un error general de nuestra propia función.
        console.error("Error en el manejador principal:", error);
        res.status(500).json({ error: 'Falló el proceso en el servidor.', details: error.message });
    }
};

module.exports = allowCors(handler);