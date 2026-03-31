import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { descripcion, tipo } = body; 

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const regimen = tipo === 'Exportación' ? 'exportación desde' : 'importación a';
    const textoTributario = tipo === 'Exportación' 
      ? '💰 ***3. Tributación y Beneficios:*** Da un panorama muy breve de los derechos de exportación (retenciones) y reintegros habituales para este rubro.'
      : '💰 ***3. Tributación General:*** Da un panorama muy breve de los derechos de importación habituales. Especificá siempre que la Tasa de Estadística (TE) es del 3%. NUNCA hables de Valores Criterio.';

    const prompt = `
    Actúa como un Senior Customs Broker Argentino hiper-actualizado a la normativa del año 2025/2026.
    Analiza la siguiente mercadería para ${regimen} la República Argentina: "${descripcion}"

    REGLAS ESTRICTAS DE ACTUALIZACIÓN NORMATIVA (¡CUMPLE ESTO A RAJATABLA!):
    1. NO uses ninguna frase introductoria, ni saludos, ni repitas tu rol. Comienza tu respuesta DIRECTAMENTE con la viñeta 1.
    2. ESTÁ ESTRICTAMENTE PROHIBIDO mencionar "Licencias No Automáticas" (LNA). Han sido derogadas en Argentina.
    3. ESTÁ ESTRICTAMENTE PROHIBIDO mencionar "Valores Criterio" o "Valores de Referencia". Han sido derogados.
    4. La Tasa de Estadística para importaciones es del 3%.

    Tu metodología de análisis debe responder EXACTAMENTE con esta estructura:
    
    🔍 ***1. Posición Arancelaria (NCM):*** Indica la NCM más probable a 8 dígitos (en formato XXXX.XX.XX) y una breve descripción.
    🚧 ***2. Intervenciones y Prohibiciones:*** Enumera las posibles intervenciones previas aplicables (ej. ANMAT, SENASA, INAL, Seguridad Eléctrica, CHAS, etc.). Recuerda: PROHIBIDO mencionar LNA o Valores Criterio.
    ${textoTributario}
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