const base = process.env.THREADS_API_BASE_URL || 'https://graph.threads.net';
const accessToken = process.env.THREADS_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error('THREADS_ACCESS_TOKEN is required');
}

async function request(method, path, data = {}) {
  const url = new URL(`${base}/${path}`);

  if (method === 'GET') {
    url.searchParams.set('access_token', accessToken);
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
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
    throw new Error(`Threads API ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForContainer(containerId, label) {
  const timeoutMs = 180000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await request('GET', containerId, {
      fields: 'id,status,error_message'
    });

    const code = String(status.status || '').toUpperCase();

    if (code === 'FINISHED') {
      console.log(`Threads ${label} ${containerId} is FINISHED`);
      return status;
    }

    if (code === 'ERROR' || code === 'EXPIRED') {
      throw new Error(
        `Threads ${label} ${containerId} failed: ${JSON.stringify(status)}`
      );
    }

    await sleep(3000);
  }

  throw new Error(
    `Threads ${label} ${containerId} did not finish within 180 seconds`
  );
}

function clampText(value, max = 500) {
  const text = String(value || '').trim();
  return text.length <= max ? text : text.slice(0, max - 3).trimEnd() + '...';
}

async function createImageContainer(imageUrl, altText) {
  return request('POST', 'me/threads', {
    media_type: 'IMAGE',
    image_url: imageUrl,
    is_carousel_item: 'true',
    alt_text: altText
  });
}

async function createCarouselContainer(children, text) {
  return request('POST', 'me/threads', {
    media_type: 'CAROUSEL',
    children: children.join(','),
    text: clampText(text)
  });
}

export async function publishThreadsCarousel(imageUrls, text, altTexts = []) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 20) {
    throw new Error('Threads carousel requires 2-20 items');
  }

  const children = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const item = await createImageContainer(
      imageUrls[i],
      altTexts[i] || `Everyday AI Desk carousel slide ${i + 1}`
    );

    if (!item.id) {
      throw new Error(
        `Threads child container creation returned no id: ${JSON.stringify(item)}`
      );
    }

    await waitForContainer(item.id, 'child container');
    children.push(item.id);
  }

  const carousel = await createCarouselContainer(children, text);

  if (!carousel.id) {
    throw new Error(
      `Threads carousel container creation returned no id: ${JSON.stringify(carousel)}`
    );
  }

  await waitForContainer(carousel.id, 'carousel container');

  const published = await request('POST', 'me/threads_publish', {
    creation_id: carousel.id
  });

  if (!published.id) {
    throw new Error(
      `Threads publish returned no post id: ${JSON.stringify(published)}`
    );
  }

  return published;
}
