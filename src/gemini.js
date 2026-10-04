import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA } from './prompt.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required');

const ai = new GoogleGenAI({ apiKey });

export async function generateEditorialPackage(researchText) {
  const prompt = `${SYSTEM_PROMPT}

CURRENT RESEARCH MATERIAL:
${researchText}`;
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: OUTPUT_SCHEMA,
      temperature: 0.2
    }
  });
  if (!response.text) throw new Error('Gemini returned no text');
  return JSON.parse(response.text);
}
