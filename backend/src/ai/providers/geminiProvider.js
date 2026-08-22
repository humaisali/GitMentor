import { GoogleGenAI, ThinkingLevel } from '@google/genai';

let client;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  client ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

const model = () => process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export const geminiProvider = {
  name: 'gemini',

  async generateStructured({ prompt, jsonSchema, reasoning, maxOutputTokens }) {
    const response = await getClient().models.generateContent({
      model: model(),
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
        thinkingConfig: { thinkingLevel: reasoning ? ThinkingLevel.MEDIUM : ThinkingLevel.MINIMAL },
        maxOutputTokens,
      },
    });
    return response.text;
  },

  async generateText({ systemInstruction, messages, reasoning, maxOutputTokens }) {
    const contents = messages.map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));
    const response = await getClient().models.generateContent({
      model: model(),
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: reasoning ? ThinkingLevel.MEDIUM : ThinkingLevel.MINIMAL },
        maxOutputTokens,
      },
    });
    return response.text;
  },

  async generateGrounded({ prompt }) {
    return getClient().models.generateContent({
      model: model(),
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
  },
};
