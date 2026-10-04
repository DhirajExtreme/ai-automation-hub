import { getAdobeAccessToken, adobeHeaders } from './adobe-auth.js';

const BASE = 'https://express-api.adobe.io';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, options = {}, {maxRetries = 3} = {}) {
  let attempt = 0;

  while (true) {
    const accessToken = await getAdobeAccessToken();
    const response = await fetch(new URL(path, BASE), {
      ...options,
      headers: {
        ...adobeHeaders(accessToken),
        ...(options.headers || {})
      }
    });

    const bodyText = await response.text();
    let body;
    try { body = bodyText ? JSON.parse(bodyText) : {}; }
    catch { body = { raw: bodyText }; }

    if (response.ok) return body;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get('retry-after') || 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 2000 * (2 ** attempt);
      attempt++;
      await sleep(delay);
      continue;
    }

    throw new Error('Adobe Express API ' + response.status + ': ' + JSON.stringify(body));
  }
}

export async function listTaggedDocuments() {
  return request('/beta/tagged-documents?start=0&limit=100&sortBy=-modifiedDate');
}

export async function getTaggedDocument(documentId) {
  return request('/beta/tagged-documents/' + encodeURIComponent(documentId));
}

export async function createAdobeVariation({
  textMappings = [],
  imageMappings = [],
  videoMappings = [],
  pageOverrides = [],
  outputs,
  variationRequestId
}) {
  if (!process.env.ADOBE_TEMPLATE_ID) throw new Error('ADOBE_TEMPLATE_ID is required');
  if (!Array.isArray(outputs) || outputs.length === 0) {
    throw new Error('At least one Adobe output is required');
  }

  const body = {
    templateOrDocument: {
      creativeCloudFileId: process.env.ADOBE_TEMPLATE_ID
    },
    input: {
      mappings: {
        textMappings,
        imageMappings,
        videoMappings
      },
      ...(pageOverrides.length ? { pageOverrides } : {}),
      ...(variationRequestId ? { variationRequestId } : {})
    },
    outputs
  };

  return request('/beta/create-variation', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
}

export async function pollAdobe(statusUrl, {maxAttempts = 60, delayMs = 3000} = {}) {
  if (!statusUrl) throw new Error('Adobe statusUrl is required');

  const parsed = new URL(statusUrl);
  const path = parsed.pathname + parsed.search;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await request(path);

    if (['succeeded', 'partially_succeeded', 'failed'].includes(result.status)) {
      return result;
    }

    await sleep(delayMs);
  }

  throw new Error('Adobe job did not finish after ' + maxAttempts + ' attempts');
}
