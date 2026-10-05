import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA } from './prompt.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required');

const ai = new GoogleGenAI({ apiKey });

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTransientGeminiError(error) {
  const status = Number(error?.status || error?.code || error?.response?.status);
  const message = String(error?.message || '').toLowerCase();
  return status === 408 || status === 429 || status >= 500 ||
    message.includes('temporarily') ||
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('unavailable');
}

async function generateWithRetry(model, prompt, maxAttempts = 6) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: OUTPUT_SCHEMA,
          thinkingConfig: { thinkingLevel: 'medium' }
        }
      });
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      const base = Math.min(60000, 1500 * (2 ** (attempt - 1)));
      const jitter = Math.floor(Math.random() * 1000);
      const delay = base + jitter;
      console.warn(
        'Gemini ' + model + ' transient error on attempt ' +
        attempt + '/' + maxAttempts + '; retrying in ' + delay + ' ms'
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function generateEditorialPackage(researchText) {
  const prompt = SYSTEM_PROMPT + '\n\nCURRENT RESEARCH MATERIAL:\n' + researchText;

  try {
    const response = await generateWithRetry(PRIMARY_MODEL, prompt, 6);
    if (!response.text) throw new Error('Gemini returned no text');
    return JSON.parse(response.text);
  } catch (primaryError) {
    if (!isTransientGeminiError(primaryError) || !FALLBACK_MODEL || FALLBACK_MODEL === PRIMARY_MODEL) {
      throw primaryError;
    }

    console.warn(
      'Primary model ' + PRIMARY_MODEL +
      ' remained unavailable after retries. Falling back to ' + FALLBACK_MODEL + '.'
    );

    const response = await generateWithRetry(FALLBACK_MODEL, prompt, 4);
    if (!response.text) throw new Error('Gemini fallback returned no text');
    return JSON.parse(response.text);
  }
}
