const API = process.env.INSTAGRAM_API_VERSION || 'v26.0';
const base = `https://graph.instagram.com/${API}`;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('INSTAGRAM_ACCESS_TOKEN is required');
}

async function request(method, path, data = {}) {
  const url = new URL(`${base}/${path}`);
  if (method === 'GET') {
    url.searchParams.set('access_token', accessToken);
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
  }

  const options = {
    method,
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  };

  if (method !== 'GET') {
    options.body = new URLSearchParams({...data, access_token: accessToken});
  }

  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`Instagram API ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForContainer(containerId, label) {
  const timeoutMs = 180000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await request('GET', containerId, {fields: 'status_code,status'});
    const statusCode = String(status.status_code || status.status || '').toUpperCase();

    if (statusCode === 'FINISHED') {
      console.log(`Instagram ${label} ${containerId} is FINISHED`);
      return status;
    }

    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw new Error(`Instagram ${label} ${containerId} failed with status ${statusCode}: ${JSON.stringify(status)}`);
    }

    await sleep(3000);
  }

  throw new Error(`Instagram ${label} ${containerId} did not finish within 180 seconds`);
}

async function createChildContainer(imageUrl) {
  return request('POST', 'me/media', {
    image_url: imageUrl,
    is_carousel_item: 'true'
  });
}

async function createCarouselContainer(children, caption) {
  return request('POST', 'me/media', {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption
  });
}

export async function publishCarousel(imageUrls, caption) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error('Instagram carousel requires 2-10 items');
  }

  const children = [];

  for (const imageUrl of imageUrls) {
    const item = await createChildContainer(imageUrl);
    if (!item.id) throw new Error(`Instagram child container creation returned no id: ${JSON.stringify(item)}`);
    await waitForContainer(item.id, 'child container');
    children.push(item.id);
  }

  const carousel = await createCarouselContainer(children, caption);
  if (!carousel.id) throw new Error(`Instagram carousel container creation returned no id: ${JSON.stringify(carousel)}`);

  await waitForContainer(carousel.id, 'carousel container');

  const published = await request('POST', 'me/media_publish', {
    creation_id: carousel.id
  });

  if (!published.id) {
    throw new Error(`Instagram publish returned no media id: ${JSON.stringify(published)}`);
  }

  return published;
}
