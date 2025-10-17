// /api/dni.js (VERSIÓN FINAL Y ROBUSTA)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        // Aceptar tanto objeto como string, y normalizar claves de entrada
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        let { numeros, dnis, dni } = body;
        if (!numeros && dnis) numeros = dnis;
        if (!numeros && dni) numeros = [dni];
        if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de "numeros".' });
        }

        const privateUrl = process.env.API_DNI_URL;
        if (!privateUrl) {
        console.error('FATAL: Variable de entorno API_DNI_URL no encontrada.');
        return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
        }

        const finalUrl = `${privateUrl}/consultar`;

        // CORRECCIÓN: El cuerpo del JSON debe usar la clave "dnis", como espera tu scraper.
        const bodyToSend = JSON.stringify({ dnis: numeros });

        const apiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyToSend
        });

        if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`Error desde API privada de DNI (status ${apiResponse.status}):`, errorBody);
        let hint = undefined;
        const lower = (errorBody || '').toLowerCase();
        if (lower.includes('ruc') || lower.includes('rucs')) {
            hint = 'La variable API_DNI_URL parece apuntar al servicio de RUC. Ajuste a la URL correcta del servicio de DNI (p.e. https://dni.billcodex.com).';
        }
        return res.status(502).json({ error: 'La API de consulta de DNI falló.', detail: errorBody, hint });
        }

        // Devolver siempre JSON y mantener fallback seguro
        try {
            const data = await apiResponse.json();
            return res.status(200).json(data);
        } catch (e) {
            const text = await apiResponse.text();
            console.error('Advertencia: respuesta no JSON desde API DNI. Texto recibido:', text);
            return res.status(200).json({ raw: text });
        }
        
    } catch (error) {
        console.error('Error en proxy de Vercel (DNI):', error.message);
        res.status(500).json({ error: 'Error en el servidor al consultar DNI.' });
    }
}