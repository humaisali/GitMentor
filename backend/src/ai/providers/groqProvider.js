import Groq from 'groq-sdk';

let client;

const getClient = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not defined in environment variables.');
  client ||= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
};

const model = () => process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';

const complete = async ({ messages, reasoning, maxOutputTokens, responseFormat }) => {
  const completion = await getClient().chat.completions.create({
    model: model(),
    messages,
    response_format: responseFormat,
    reasoning_effort: reasoning ? 'default' : 'none',
    reasoning_format: 'hidden',
    max_completion_tokens: maxOutputTokens,
  });
  return completion.choices[0]?.message?.content || '';
};

export const groqProvider = {
  name: 'groq',

  generateStructured({ prompt, jsonSchema, reasoning, maxOutputTokens }) {
    const schemaInstruction = `Return one JSON object that matches this JSON Schema exactly:\n${JSON.stringify(jsonSchema)}`;
    return complete({
      messages: [{ role: 'system', content: schemaInstruction }, { role: 'user', content: prompt }],
      reasoning,
      maxOutputTokens,
      responseFormat: { type: 'json_object' },
    });
  },

  generateText({ systemInstruction, messages, reasoning, maxOutputTokens }) {
    return complete({
      messages: [{ role: 'system', content: systemInstruction }, ...messages],
      reasoning,
      maxOutputTokens,
    });
  },
};
