    // /api/tc.js

    // Esta función será tu endpoint público: https://[tu-dominio].vercel.app/api/tc
    export default async function handler(req, res) {
    // 1. Configuración de CORS para permitir que tu extensión se conecte
    res.setHeader('Access-Control-Allow-Origin', '*'); // Para producción, puedes cambiar '*' por 'chrome-extension://ID-DE-TU-EXTENSION'
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Vercel necesita esto para las pre-solicitudes de los navegadores
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 2. Lee la URL secreta de tu API de TC desde las variables de Vercel
        const privateUrl = process.env.API_TC_URL;

        // Medida de seguridad: si la variable no está configurada, devuelve un error
        if (!privateUrl) {
        throw new Error('La variable de entorno API_TC_URL no está configurada en Vercel.');
        }

        // 3. Llama a tu API privada de Cloud Run desde el servidor de Vercel
        const apiResponse = await fetch(privateUrl);

        if (!apiResponse.ok) {
            throw new Error(`La API de Cloud Run respondió con un error: ${apiResponse.status}`);
        }

        // 4. Devuelve la respuesta a tu extensión de Chrome
        const data = await apiResponse.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Error en el proxy de TC:', error.message);
        res.status(500).json({ error: 'Error al obtener el tipo de cambio desde el servidor.' });
    }
    }