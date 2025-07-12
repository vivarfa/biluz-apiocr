// api/text-parser.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await fn(req, res);
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    const { textToParse, fields } = req.body;
    if (!textToParse || !fields || !Array.isArray(fields)) return res.status(400).json({ error: 'Faltan parámetros.' });
    
    try {
        const fieldList = fields.map(f => `- ${f.id} (${f.label})`).join('\n');
        const prompt = `Actúa como un asistente contable experto en extraer datos de documentos peruanos. Analiza el siguiente texto y extrae la información correspondiente a los campos que te proporciono. Devuelve un objeto JSON donde las claves sean los 'id' de los campos y los valores sean los datos extraídos. Si no encuentras un dato, deja su valor como un string vacío "". Si una fecha está en formato "12 de Julio de 2025", conviértela a "2025-07-12". No inventes información.\n\nCampos a extraer:\n${fieldList}\n\nTexto a analizar:\n---\n${textToParse}\n---\n\nObjeto JSON resultante:`;
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const cleanedJsonString = aiResponse.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedData = JSON.parse(cleanedJsonString);
        res.status(200).json({ extractedData });
    } catch (error) {
        console.error("Error en text-parser:", error);
        res.status(500).json({ error: 'Falló el análisis de IA.', details: error.message });
    }
};
module.exports = allowCors(handler);