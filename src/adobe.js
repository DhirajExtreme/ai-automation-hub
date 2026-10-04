import { getAdobeAccessToken, adobeHeaders } from './adobe-auth.js';

const BASE = 'https://express-api.adobe.io';

async function request(path, options = {}) {
  const accessToken = await getAdobeAccessToken();
  const response = await fetch(`${BASE}${path}`, {
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

  if (!response.ok) {
    throw new Error(`Adobe Express API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export async function listTaggedDocuments() {
  return request('/beta/tagged-documents?start=0&limit=25&sortBy=-modifiedDate');
}

export async function getTaggedDocument(documentId) {
  return request(`/beta/tagged-documents/${encodeURIComponent(documentId)}`);
}

export async function createAdobeVariation({ textMappings = [], imageMappings = [], videoMappings = [], outputs, variationRequestId }) {
  if (!process.env.ADOBE_TEMPLATE_ID) throw new Error('ADOBE_TEMPLATE_ID is required');
  if (!Array.isArray(outputs) || outputs.length === 0) throw new Error('At least one Adobe output is required');

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

export async function pollAdobe(statusUrl, {maxAttempts = 40, delayMs = 3000} = {}) {
  if (!statusUrl) throw new Error('Adobe statusUrl is required');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await request(new URL(statusUrl).pathname + new URL(statusUrl).search);

    if (['succeeded', 'partially_succeeded', 'failed'].includes(result.status)) {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error(`Adobe job did not finish after ${maxAttempts} attempts`);
}
