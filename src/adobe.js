const BASE = 'https://express-api.adobe.io/beta';
const headers = () => ({
  Authorization: `Bearer ${process.env.ADOBE_ACCESS_TOKEN}`,
  'X-API-KEY': process.env.ADOBE_API_KEY,
  'Content-Type': 'application/json'
});

export async function createAdobeVariation(mappings, outputs) {
  const body = {
    templateOrDocument: { creativeCloudFileId: process.env.ADOBE_TEMPLATE_ID },
    textMappings: Object.entries(mappings.text || {}).map(([name, value]) => ({ name, value })),
    imageMappings: Object.entries(mappings.images || {}).map(([name, value]) => ({ name, value })),
    outputs
  };
  const r = await fetch(`${BASE}/create-variation`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Adobe create-variation failed: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function pollAdobe(statusUrl) {
  for (let i = 0; i < 30; i++) {
    const r = await fetch(statusUrl, { headers: headers() });
    if (!r.ok) throw new Error(`Adobe status failed: ${r.status} ${await r.text()}`);
    const data = await r.json();
    if (data.status === 'succeeded' || data.status === 'failed') return data;
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error('Adobe job timed out');
}
