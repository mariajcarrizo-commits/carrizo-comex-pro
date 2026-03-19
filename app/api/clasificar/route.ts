import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { descripcion } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 🧠 EL SYSTEM PROMPT DE ELITE 🧠
    const prompt = `
    Actúa como un Senior Customs Broker Argentino.
    Analiza la siguiente mercadería para importación a Argentina: "${descripcion}"

    REGLA ESTRICTA: NO uses ninguna frase introductoria, ni saludos, ni repitas tu rol. Comienza tu respuesta DIRECTAMENTE con la viñeta 1.

   Tu metodología de análisis debe responder EXACTAMENTE con esta estructura:
    
    🔍 ***1. Posición Arancelaria (NCM):*** Indica la NCM más probable a 8 dígitos (en formato XXXX.XX.XX) y una breve descripción.
    🚧 ***2. Intervenciones y Prohibiciones:*** Enumera las posibles intervenciones previas aplicables (ej. ANMAT, SENASA, INAL, Seguridad Eléctrica, CHAS, etc.).
    💰 ***3. Tributación General:*** Da un panorama muy breve de los derechos de importación habituales.
    ⚖️ ***4. Regla de Oro:*** "Atención: Análisis referencial. Requiere verificación manual definitiva en el Sistema Informático Malvina y Boletín Oficial."
     `;

    const result = await model.generateContent(prompt);
    const textoResult = result.response.text();

    return NextResponse.json({ sugerencia: textoResult.trim() });
    
  } catch (error) {
    console.error('Error con la IA:', error);
    return NextResponse.json({ sugerencia: 'Error de conexión con el Agente Aduanero (IA)' }, { status: 500 });
  }
}