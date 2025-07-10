// api/intelligent-ocr.js
const axios = require('axios');
const { createWorker } = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const handler = async (req, res) => {
    console.log("==== INICIO DE PETICIÓN OCR INTELIGENTE ====");
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
        return res.status(400).json({ error: 'Falta el parámetro imageUrl.' });
    }
    console.log("URL recibida:", imageUrl);

    try {
        console.log("Paso 1: Descargando el documento...");
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        console.log("Documento descargado correctamente.");

        console.log("Paso 2: Iniciando worker de Tesseract para 'spa'...");
        const worker = await createWorker('spa');
        const { data: { text: rawText } } = await worker.recognize(imageBuffer);
        await worker.terminate();
        console.log("OCR completado. Primeros 100 caracteres:", rawText.substring(0, 100).replace(/\n/g, " "));

        if (!rawText || rawText.trim().length < 10) {
             return res.status(400).json({ error: 'No se pudo extraer texto significativo del documento.' });
        }

        console.log("Paso 3: Enviando texto a la IA para análisis...");
        const prompt = `...`; // El prompt no cambia
        
        // (El prompt es el mismo que antes, no es necesario copiarlo de nuevo)
        const result = await model.generateContent(prompt);
        const aiResponse = await result.response;
        let aiText = aiResponse.text();
        console.log("Respuesta de la IA recibida:", aiText);
        
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const extractedData = JSON.parse(aiText);

        console.log("Paso 4: Enviando respuesta JSON al cliente.");
        res.status(200).json({ ...extractedData });

    } catch (error) {
        console.error("!!!! ERROR EN EL PROCESO DE OCR:", error);
        res.status(500).json({ error: 'Falló el proceso en el servidor.', details: error.message });
    }
    console.log("==== FIN DE PETICIÓN ====");
};

module.exports = allowCors(handler);