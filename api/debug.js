// api/debug.js
// Este archivo es solo para depurar y se puede borrar después.

const allowCors = fn => (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return fn(req, res);
};

const handler = (req, res) => {
    // Leemos las variables de entorno desde el servidor de Vercel
    const rucToken = process.env.RUC_API_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;

    res.status(200).json({
        message: "Resultado de la depuración de Variables de Entorno en Vercel.",
        ruc_token_exists: !!rucToken, // true si existe, false si no
        ruc_token_preview: rucToken ? `${rucToken.substring(0, 4)}...${rucToken.slice(-4)}` : null,
        gemini_key_exists: !!geminiKey, // Verificamos la otra por si acaso
        gemini_key_preview: geminiKey ? `${geminiKey.substring(0, 4)}...${geminiKey.slice(-4)}` : null
    });
};

module.exports = allowCors(handler);