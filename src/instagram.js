const API = process.env.INSTAGRAM_API_VERSION || 'v24.0';
const base = `https://graph.instagram.com/${API}`;

async function post(path, data) {
  const r = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers: {'Content-Type':'application/x-www-form-urlencoded'},
    body: new URLSearchParams({...data, access_token: process.env.INSTAGRAM_ACCESS_TOKEN})
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`Instagram API ${r.status}: ${JSON.stringify(json)}`);
  return json;
}

export async function publishCarousel(imageUrls, caption) {
  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error('Instagram carousel requires 2-10 items');
  }
  const children = [];
  for (const imageUrl of imageUrls) {
    const item = await post(`${process.env.INSTAGRAM_USER_ID}/media`, {
      image_url: imageUrl,
      is_carousel_item: 'true'
    });
    children.push(item.id);
  }
  const carousel = await post(`${process.env.INSTAGRAM_USER_ID}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption
  });
  return post(`${process.env.INSTAGRAM_USER_ID}/media_publish`, { creation_id: carousel.id });
}
