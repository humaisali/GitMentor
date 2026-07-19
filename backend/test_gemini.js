import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'test',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              projectId: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              estTime: { type: Type.STRING },
              prereq: { type: Type.STRING },
            },
            required: ["projectId", "title", "description", "difficulty", "estTime", "prereq"],
          },
        },
      },
    });
    console.log(response.text);
  } catch (error) {
    console.error('ERROR OCCURRED:', error.message);
  }
}

run();
