    // /api/ruc.js
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
        // Lee la variable de entorno para RUC
        const privateUrl = process.env.API_RUC_URL;

        if (!privateUrl) {
        console.error('ERROR: La variable de entorno API_RUC_URL no está configurada en Vercel.');
        throw new Error('Configuración del servidor incompleta.');
        }

        // Llama a tu API de Cloud Run
        const finalUrl = `${privateUrl}/consultar`;
        const apiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeros: numeros })
        });

        // CORRECCIÓN CLAVE: Verifica si la respuesta NO fue exitosa
        if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`La API privada de RUC falló con estado ${apiResponse.status}: ${errorText}`);
        }
        
        // Si todo salió bien, devuelve los datos a la extensión
        const data = await apiResponse.json();
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Error en el proxy de Vercel (RUC):', error.message);
        res.status(500).json({ error: 'Error en el servidor al consultar RUC.' });
    }
    }