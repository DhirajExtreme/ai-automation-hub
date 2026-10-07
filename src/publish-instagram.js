import fs from 'node:fs/promises';
import { publishCarousel } from './instagram.js';

const baseUrl = process.env.PUBLIC_ASSET_BASE_URL;
if (!baseUrl) {
  throw new Error(
    'PUBLIC_ASSET_BASE_URL is required for Instagram publishing. ' +
    'Meta must be able to fetch public HTTPS image URLs.'
  );
}

const pkg = JSON.parse(await fs.readFile('artifacts/daily.json', 'utf8'));
const manifest = JSON.parse(await fs.readFile('artifacts/carousel-manifest.json', 'utf8'));

if (!Array.isArray(manifest.files) || manifest.files.length < 2) {
  throw new Error('Carousel manifest contains fewer than 2 files.');
}

const imageUrls = manifest.files.map(function(filePath) {
  const relative = filePath.replaceAll('\\\\', '/');
  return baseUrl.replace(/\/$/, '') + '/' + relative.replace(/^artifacts\//, '');
});

async function verifyPublicAssets() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      for (const url of imageUrls) {
        const response = await fetch(url, {method: 'HEAD'});
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' for ' + url);
        }
      }
      console.log('Verified ' + imageUrls.length + ' public carousel image URLs.');
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      const delay = attempt * 3000;
      console.warn('Public asset verification attempt ' + attempt + ' failed; retrying in ' + delay + ' ms');
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

await verifyPublicAssets();

const published = await publishCarousel(imageUrls, pkg.instagram.caption);

await fs.writeFile(
  'artifacts/instagram-publish.json',
  JSON.stringify({
    published,
    imageUrls,
    publishedAt: new Date().toISOString()
  }, null, 2)
);

console.log('Instagram carousel published: ' + (published.id || 'ok'));
try {
  const verifyUrl = 'https://graph.instagram.com/' +
    (process.env.INSTAGRAM_API_VERSION || 'v26.0') + '/' +
    published.id +
    '?fields=id,media_type,timestamp,permalink';
  const response = await fetch(verifyUrl, {
    headers: {'Authorization': 'Bearer ' + process.env.INSTAGRAM_ACCESS_TOKEN}
  });
  if (response.ok) {
    const verified = await response.json();
    await fs.writeFile(
      'artifacts/instagram-publish-verification.json',
      JSON.stringify(verified, null, 2)
    );
    console.log('Instagram publish verified: ' + JSON.stringify(verified));
  } else {
    console.warn('Instagram publish verification returned HTTP ' + response.status);
  }
} catch (error) {
  console.warn('Instagram publish verification failed: ' + error.message);
}
