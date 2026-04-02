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
      ? '***💰 3. TRIBUTACIÓN Y BENEFICIOS***\nDa un panorama muy breve de los derechos de exportación (retenciones) y reintegros habituales para este rubro.'
      : '***💰 3. TRIBUTACIÓN GENERAL***\nDa un panorama muy breve de los derechos de importación habituales. Especificá siempre que la Tasa de Estadística (TE) es del 3%. NUNCA hables de Valores Criterio.';

    const prompt = `
    Actúa como un Senior Customs Broker Argentino hiper-actualizado a la normativa del año 2025/2026.
    Analiza la siguiente mercadería para ${regimen} la República Argentina: "${descripcion}"

    REGLAS ESTRICTAS DE ACTUALIZACIÓN NORMATIVA (¡CUMPLE ESTO A RAJATABLA!):
    1. NO uses ninguna frase introductoria, ni saludos, ni repitas tu rol. Comienza tu respuesta DIRECTAMENTE con la viñeta 1.
    2. ESTÁ ESTRICTAMENTE PROHIBIDO mencionar "Licencias No Automáticas" (LNA). Han sido derogadas en Argentina.
    3. ESTÁ ESTRICTAMENTE PROHIBIDO mencionar "Valores Criterio" o "Valores de Referencia". Han sido derogados.
    4. La Tasa de Estadística para importaciones es del 3%.

    Tu metodología de análisis debe responder EXACTAMENTE con esta estructura, utilizando los asteriscos para los títulos y negritas para resaltar:
    
    ***📦 1. CLASIFICACIÓN A 12 DÍGITOS (POSICIÓN SIM)***
    **NCM (8 dígitos):** [Indica aquí los 8 números, ej: 9004.10.00] y una breve descripción.
    **Sufijo y Letra de Control:** [Indica los 3 caracteres y la letra de control, ej: 000 A]
    **Posición SIM Completa:** [Ej: 9004.10.00.000 A]

    ***🚨 2. TERCEROS ORGANISMOS E INTERVENCIONES***
    **Organismos Exigibles:** [Menciona los organismos reales como ANMAT, SENASA, INAL, Seguridad Eléctrica, CHAS, INTI, etc. Si no lleva, escribe "Sin intervenciones previas de terceros organismos"]. Recuerda: PROHIBIDO mencionar LNA.
    **Detalle de la Intervención:** [Explica brevemente qué tipo de certificado, DJCP o permiso especial tramitaría el despachante].

    ${textoTributario}

    ***⚖️ 4. JUSTIFICACIÓN LEGAL Y REGLA DE ORO***
    [Explica brevemente por qué corresponde esta NCM según las Reglas Generales para la Interpretación (RGI)].
    **Regla de Oro:** "Atención: Análisis referencial. Requiere verificación manual definitiva en el Sistema Informático Malvina y Boletín Oficial."
    `;

    const result = await model.generateContent(prompt);
    const textoResult = result.response.text();

    return NextResponse.json({ sugerencia: textoResult.trim() });
    
  } catch (error) {
    console.error('Error con la IA:', error);
    return NextResponse.json({ sugerencia: 'Error de conexión con el Agente Aduanero (IA)' }, { status: 500 });
  }
}