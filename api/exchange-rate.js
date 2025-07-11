// api/exchange-rate.js (VERSIÓN COMPLETAMENTE CORREGIDA)
const axios = require('axios');

// Función para habilitar CORS
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    return await fn(req, res);
};

const handler = async (req, res) => {
    try {
        // Validar método HTTP
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Método no permitido. Solo GET es soportado.' });
        }

        // Obtener y validar fecha
        let dateToQuery = req.query.date;
        
        if (!dateToQuery) {
            dateToQuery = new Date().toISOString().split('T')[0];
        } else {
            // Validar formato de fecha
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateToQuery)) {
                return res.status(400).json({ 
                    error: 'Formato de fecha inválido. Use YYYY-MM-DD' 
                });
            }
        }

        // Verificar token
        const token = process.env.RUC_API_TOKEN;
        if (!token) {
            console.error('Token de API no configurado');
            return res.status(500).json({ 
                error: 'Configuración del servidor incorrecta' 
            });
        }

        // Construir URL para la API externa
        const url = `https://api.apis.net.pe/v2/sunat/tipo-cambio?date=${dateToQuery}`;
        
        console.log(`Consultando: ${url}`);

        // Realizar consulta a la API externa
        const response = await axios.get(url, {
            headers: {
                'Referer': 'https://apis.net.pe/consulta-ruc-api',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 segundos timeout
        });

        // Validar respuesta
        if (!response.data) {
            throw new Error('Respuesta vacía de la API externa');
        }

        // Verificar estructura de datos
        const { compra, venta, fecha } = response.data;
        
        if (compra === undefined || venta === undefined) {
            throw new Error('Datos incompletos en la respuesta de la API');
        }

        // Devolver datos formateados
        return res.status(200).json({
            fecha: fecha || dateToQuery,
            compra: parseFloat(compra),
            venta: parseFloat(venta),
            success: true
        });

    } catch (error) {
        console.error('Error en exchange-rate API:', error);

        // Manejo específico de errores de Axios
        if (error.response) {
            // La API externa respondió con un error
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;
            
            if (status === 404) {
                return res.status(404).json({
                    error: `No se encontró tipo de cambio para la fecha ${req.query.date || 'solicitada'}`,
                    details: 'La fecha puede ser muy antigua o muy reciente'
                });
            } else if (status === 401) {
                return res.status(500).json({
                    error: 'Error de autenticación con el servicio externo'
                });
            } else if (status === 429) {
                return res.status(429).json({
                    error: 'Demasiadas consultas. Intente nuevamente más tarde'
                });
            } else {
                return res.status(500).json({
                    error: `Error del servicio externo: ${message}`
                });
            }
        } else if (error.request) {
            // Error de red
            return res.status(503).json({
                error: 'Servicio no disponible temporalmente'
            });
        } else if (error.code === 'ECONNABORTED') {
            // Timeout
            return res.status(408).json({
                error: 'La consulta tardó demasiado tiempo'
            });
        } else {
            // Otro tipo de error
            return res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = allowCors(handler);