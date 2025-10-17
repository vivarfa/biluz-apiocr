    // /api/ruc.js
    // Endpoint público: https://[tu-dominio].vercel.app/api/ruc
    export default async function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { numeros } = req.body;
    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de "numeros".' });
    }

    try {
        // Lee la variable de entorno ESPECÍFICA para RUC
        const privateUrl = process.env.API_RUC_URL;

        if (!privateUrl) {
        throw new Error('La variable de entorno API_RUC_URL no está configurada.');
        }

        // Llama a tu API de Cloud Run de RUC
        const finalUrl = `${privateUrl}/consultar`;
        const apiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeros: numeros })
        });

        if (!apiResponse.ok) throw new Error(`Error en la API privada de RUC: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Error en proxy RUC:', error.message);
        res.status(500).json({ error: 'Error en el servidor al consultar RUC.' });
    }
    }