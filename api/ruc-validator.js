// api/ruc-validator.js

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

// --- SIMULACIÓN DE CONSULTA A SUNAT ---
const simularConsultaSunat = (ruc) => {
    // Lógica simple para simular diferentes estados
    if (ruc.startsWith('20')) {
        return { ruc, estado: 'ACTIVO', condicion: 'HABIDO' };
    }
    if (ruc.startsWith('10')) {
        return { ruc, estado: 'ACTIVO', condicion: 'HABIDO' };
    }
    if (ruc === '12345678901') {
        return { ruc, estado: 'BAJA DE OFICIO', condicion: 'NO HABIDO' };
    }
    return { ruc, estado: 'NO ENCONTRADO', condicion: '----' };
};

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { rucs } = req.body;

    if (!rucs || !Array.isArray(rucs) || rucs.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de RUCs.' });
    }

    try {
        // Procesamos cada RUC con nuestra función de simulación
        const resultados = rucs.map(ruc => simularConsultaSunat(ruc));
        
        // Devolvemos la lista de resultados
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Error en el validador de RUCs:", error);
        res.status(500).json({ error: 'Falló el proceso en el servidor.', details: error.message });
    }
};

module.exports = allowCors(handler);