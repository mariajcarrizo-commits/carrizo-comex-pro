import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Conectamos con la llave secreta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { descripcion } = body;

    // Usamos mi modelo más rápido e inteligente
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Le damos a la IA la personalidad de un despachante experto
    const prompt = `
    Eres un Despachante de Aduanas Senior en Argentina, experto en Nomenclatura Común del Mercosur (NCM).
    Tu tarea es clasificar la siguiente mercadería y devolver ÚNICAMENTE la Posición Arancelaria NCM más probable de 8 dígitos, separada por puntos (ejemplo: 8517.12.31), seguida de un guión y una breve descripción oficial de máximo 5 palabras.
    
    Mercadería a clasificar: "${descripcion}"
    
    Respuesta esperada: [CÓDIGO NCM] - [DESCRIPCIÓN CORTA]
    `;

    // Hacemos la magia
    const result = await model.generateContent(prompt);
    const textoResult = result.response.text();

    return NextResponse.json({ sugerencia: textoResult.trim() });
    
  } catch (error) {
    console.error('Error con la IA:', error);
    return NextResponse.json({ sugerencia: 'Error de conexión con IA' }, { status: 500 });
  }
}