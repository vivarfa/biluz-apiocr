// /api/ruc.js (VERSIÓN FINAL Y ROBUSTA)
    export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Aceptar tanto objeto como string (por seguridad en distintos runtimes)
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        // Aceptar 'numeros', 'rucs' o 'ruc' y normalizar a array
        let { numeros, rucs, ruc } = body;
        if (!numeros && rucs) numeros = rucs;
        if (!numeros && ruc) numeros = [ruc];
        if (!Array.isArray(numeros) || numeros.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de "numeros".' });
        }

        const privateUrl = process.env.API_RUC_URL;
        if (!privateUrl) {
        console.error('FATAL: Variable de entorno API_RUC_URL no encontrada.');
        return res.status(500).json({ error: 'Configuración del servidor incompleta.' });
        }

        const finalUrl = `${privateUrl}/consultar`;
        
        // CORRECCIÓN: El cuerpo del JSON debe usar la clave "rucs", como espera tu scraper.
        // El servicio Flask espera la clave 'rucs'
        const bodyToSend = JSON.stringify({ rucs: numeros });

        const apiResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyToSend
        });

        if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`Error desde API privada de RUC (status ${apiResponse.status}):`, errorBody);
        return res.status(502).json({ error: `La API de consulta de RUC falló.` });
        }
        
        const text = await apiResponse.text();
        // Intentar parsear; si falla, retornar texto para depuración
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        res.status(200).json(data);
        
    } catch (error) {
        console.error('Error en proxy de Vercel (RUC):', error.message);
        res.status(500).json({ error: 'Error en el servidor al consultar RUC.' });
    }
    }