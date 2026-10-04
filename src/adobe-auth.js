let cachedToken = null;
let cachedExpiryMs = 0;

export async function getAdobeAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExpiryMs - 60_000) return cachedToken;

  const clientId = process.env.ADOBE_CLIENT_ID;
  const clientSecret = process.env.ADOBE_CLIENT_SECRET;
  const scope = process.env.ADOBE_SCOPE;

  if (!clientId) throw new Error('ADOBE_CLIENT_ID is required');
  if (!clientSecret) throw new Error('ADOBE_CLIENT_SECRET is required');
  if (!scope) throw new Error('ADOBE_SCOPE is required');

  const response = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope
    })
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Adobe OAuth failed: ${response.status} ${JSON.stringify(body)}`);
  }

  cachedToken = body.access_token;
  cachedExpiryMs = now + Number(body.expires_in || 86400) * 1000;
  return cachedToken;
}

export function adobeHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'X-API-KEY': process.env.ADOBE_CLIENT_ID
  };
}
