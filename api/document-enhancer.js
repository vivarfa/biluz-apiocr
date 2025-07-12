// api/document-enhancer.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Middleware para habilitar CORS (Control de Acceso)
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Permite peticiones desde cualquier origen
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    return await fn(req, res);
};

// Inicialización del modelo de IA de Google usando tu clave de Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const handler = async (req, res) => {
    // Solo aceptamos peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { draftText, documentType, sectionTitle } = req.body;

    // Validación de entrada
    if (!draftText || !documentType || !sectionTitle) {
        return res.status(400).json({ error: 'Faltan parámetros: se requiere borrador, tipo de documento y sección.' });
    }

    try {
        // Instrucciones precisas para la IA
        const prompt = `
            Actúa como un abogado y contador peruano experto en redacción de documentos formales.
            Tu tarea es tomar los siguientes puntos clave o el borrador y expandirlos en un párrafo formal, coherente y profesional.
            El párrafo es para la sección "${sectionTitle}" de un documento de tipo "${documentType}".
            Mantén un tono respetuoso pero firme y claro. No añadas introducciones como "A continuación, se presenta el párrafo..." ni conclusiones.
            Solo devuelve el texto del párrafo mejorado.

            Borrador del usuario:
            ---
            ${draftText}
            ---
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        const enhancedText = aiResponse.text();

        // Devolvemos el texto mejorado
        res.status(200).json({ enhancedText });

    } catch (error) {
        console.error("Error en la API de IA para documentos:", error);
        res.status(500).json({ error: 'Falló el proceso de IA en el servidor.', details: error.message });
    }
};

// Exportamos la función envuelta en el middleware de CORS
module.exports = allowCors(handler);