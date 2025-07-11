// api/query-api.js (VERSIÓN FINAL Y POTENCIADA)
const axios = require('axios');

const allowCors = fn => async (req, res) => {
    // ... (El código de allowCors no cambia) ...
};

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { numeros } = req.body;
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de números (RUC/DNI).' });
    }

    try {
        const resultados = [];
        const token = process.env.RUC_API_TOKEN; // Usamos el mismo token para todo

        for (const numero of numeros) {
            let url;
            let tipo;

            // Decidimos si es RUC o DNI basándonos en la longitud
            if (numero.length === 11) {
                // Usaremos la consulta RUC extendida para obtener más datos
                url = `https://api.apis.net.pe/v2/sunat/ruc?numero=${numero}`;
                tipo = 'RUC';
            } else if (numero.length === 8) {
                url = `https://api.apis.net.pe/v2/reniec/dni?numero=${numero}`;
                tipo = 'DNI';
            } else {
                resultados.push({ tipo: 'Error', numero, nombre: 'Número no válido (debe tener 8 o 11 dígitos).' });
                continue; // Pasamos al siguiente número
            }

            try {
                const response = await axios.get(url, {
                    headers: {
                        'Referer': 'https://apis.net.pe/consulta-ruc-api',
                        'Authorization': `Bearer ${token}`
                    }
                });
                resultados.push({ tipo, ...response.data });
            } catch (error) {
                resultados.push({ tipo, numero, nombre: `${tipo} ${numero} no encontrado.`, error: true });
            }
        }
        
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Error en la API de consulta:", error);
        res.status(500).json({ error: 'Falló el proceso en el servidor.', details: error.message });
    }
};

module.exports = allowCors(handler);