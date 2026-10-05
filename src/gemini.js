import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA } from './prompt.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error('GEMINI_API_KEY is required');

const ai = new GoogleGenAI({ apiKey });

const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  'gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .filter((model, index, list) => model !== PRIMARY_MODEL && list.indexOf(model) === index);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getStatus(error) {
  return Number(error?.status || error?.code || error?.response?.status || 0);
}

function isTransientGeminiError(error) {
  const status = getStatus(error);
  const message = String(error?.message || '').toLowerCase();

  return status === 408 ||
    status === 429 ||
    status >= 500 ||
    message.includes('temporarily') ||
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('unavailable') ||
    message.includes('timeout') ||
    message.includes('timed out');
}

function isModelOrParameterError(error) {
  const status = getStatus(error);
  return status === 400 || status === 404 || status === 415;
}

function buildConfig(model) {
  const config = {
    responseMimeType: 'application/json',
    responseSchema: OUTPUT_SCHEMA
  };

  // Gemini 3.8 explicitly supports thinkingLevel. Keep the primary model's
  // reasoning quality high while using a lighter configuration for fallbacks.
  if (model === PRIMARY_MODEL || model.startsWith('gemini-3.8')) {
    config.thinkingConfig = { thinkingLevel: 'medium' };
  } else if (model.includes('flash-lite')) {
    config.thinkingConfig = { thinkingLevel: 'low' };
  }

  return config;
}

async function generateOnce(model, prompt) {
  return await ai.models.generateContent({
    model,
    contents: prompt,
    config: buildConfig(model)
  });
}

async function generateWithRetry(model, prompt, maxAttempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await generateOnce(model, prompt);
    } catch (error) {
      lastError = error;

      if (isModelOrParameterError(error)) {
        throw error;
      }

      if (!isTransientGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      const base = Math.min(12000, 1500 * (2 ** (attempt - 1)));
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

function responseToPackage(response, model) {
  if (!response?.text) throw new Error('Gemini returned no text');
  const pkg = JSON.parse(response.text);
  console.log('Editorial package generated with model: ' + model);
  return pkg;
}

function stripXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function firstMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] : '';
}

function extractFallbackStories(researchText) {
  const sections = researchText.split(/SOURCE FEED:\s*/i).slice(1);
  const items = [];

  for (const section of sections) {
    const feedUrl = firstMatch(section, /^(https?:\\/\\/[^\\s]+)/i);
    const body = section.slice(feedUrl.length);

    const blocks = body.match(/<(?:item|entry)\\b[\\s\\S]*?<\\/(?:item|entry)>/gi) || [];
    for (const block of blocks) {
      const title = stripXml(firstMatch(block, /<title[^>]*>([\\s\\S]*?)<\\/title>/i));
      const description = stripXml(
        firstMatch(block, /<(?:description|summary|content:encoded)[^>]*>([\\s\\S]*?)<\\/(?:description|summary|content:encoded)>/i)
      );

      let link = firstMatch(block, /<link[^>]*href=["'](https?:\\/\\/[^"']+)["']/i);
      if (!link) link = firstMatch(block, /<link[^>]*>(https?:\\/\\/[^<\\s]+)/i);

      if (!title || !link) continue;

      const key = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\\s+/g, ' ').trim();
      if (!key || items.some(item => item.key === key)) continue;

      let sourceName = 'Source';
      try {
        sourceName = new URL(feedUrl).hostname.replace(/^www\\./, '');
      } catch {}

      items.push({
        key,
        headline: title,
        summary: description || 'A current AI and technology development reported by ' + sourceName + '.',
        whyItMatters: 'This is a notable current development for people following AI, technology and the products built around them.',
        sourceName,
        sourceUrl: link
      });
    }
  }

  return items.slice(0, 5);
}

function buildDeterministicFallback(researchText) {
  const stories = extractFallbackStories(researchText);

  if (stories.length < 5) {
    throw new Error(
      'Gemini is temporarily unavailable and the feed-only fallback found only ' +
      stories.length + ' usable stories.'
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  const script = stories
    .map((story, index) => 'Story ' + (index + 1) + ': ' + story.headline + '.')
    .join(' ');

  return {
    date,
    stories,
    instagram: {
      caption:
        'Today\'s AI brief from Everyday AI Desk. Five major developments worth knowing, ' +
        'with sources included in the daily package. Follow @everydayaidesk.',
      hashtags: ['#AI', '#ArtificialIntelligence', '#Technology', '#AITech', '#EverydayAIDesk']
    },
    youtube: {
      title: 'Today in AI: 5 Major Developments | Everyday AI Desk',
      description:
        'A quick daily briefing on five major AI and technology developments. ' +
        'Subscribe to Everyday AI Desk on YouTube.',
      script: script + ' Follow Everyday AI Desk for the next daily briefing.',
      tags: ['AI', 'Artificial Intelligence', 'Technology', 'AI News', 'Everyday AI Desk']
    },
    generationMode: 'feed-fallback'
  };
}

export async function generateEditorialPackage(researchText) {
  const prompt = SYSTEM_PROMPT + '\n\nCURRENT RESEARCH MATERIAL:\n' + researchText;

  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  const failures = [];

  for (const model of models) {
    try {
      const attempts = model === PRIMARY_MODEL ? 2 : 2;
      const response = await generateWithRetry(model, prompt, attempts);
      return responseToPackage(response, model);
    } catch (error) {
      failures.push(
        model + ' -> ' + (getStatus(error) || 'ERR') + ': ' + String(error?.message || error)
      );

      console.warn('Gemini model failed: ' + failures[failures.length - 1]);

      // Keep trying other models for any model-specific or transient failure.
      // Authentication/billing failures are still surfaced after the cascade.
    }
  }

  console.warn(
    'All configured Gemini models failed. Using deterministic feed fallback. ' +
    failures.join(' | ')
  );

  return buildDeterministicFallback(researchText);
}
