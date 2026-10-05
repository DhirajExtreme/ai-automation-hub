import fs from 'node:fs/promises';
import { collectResearch } from './research.js';
import { generateEditorialPackage } from './gemini.js';
import { validatePackage } from './validate.js';
import { renderCarousel } from './render.js';
import { publishCarousel } from './instagram.js';

const dryRun = process.env.DRY_RUN !== 'false';
const renderEnabled = process.env.RENDER_CAROUSEL !== 'false';
const publishInstagramEnabled = process.env.PUBLISH_INSTAGRAM === 'true';
const outputDir = 'artifacts';
const social = JSON.parse(await fs.readFile('config/social.json', 'utf8'));
const crossPlatformCta = social.crossPlatformCta;

function enforceCrossPlatformCta(pkg) {
  if (pkg?.instagram) {
    const caption = String(pkg.instagram.caption || '').trim();
    if (!caption.includes(crossPlatformCta)) {
      pkg.instagram.caption = caption + (caption ? '\\n\\n' : '') + crossPlatformCta;
    }
  }
  if (pkg?.youtube) {
    const description = String(pkg.youtube.description || '').trim();
    if (!description.includes(crossPlatformCta)) {
      pkg.youtube.description = description + (description ? '\\n\\n' : '') + crossPlatformCta;
    }
  }
  return pkg;
}

const research = await collectResearch();
const pkg = enforceCrossPlatformCta(await generateEditorialPackage(research));
validatePackage(pkg);

await fs.mkdir(outputDir, {recursive:true});
await fs.writeFile(outputDir + '/daily.json', JSON.stringify(pkg, null, 2));
await fs.writeFile(
  outputDir + '/sources.json',
  JSON.stringify(
    pkg.stories.map(function(s) {
      return {
        headline: s.headline,
        sourceName: s.sourceName,
        sourceUrl: s.sourceUrl
      };
    }),
    null,
    2
  )
);

console.log('Validated ' + pkg.stories.length + ' stories for ' + pkg.date);
console.log('Dry run: ' + dryRun);
console.log('HTML/CSS carousel render: ' + renderEnabled);
console.log('Instagram publish: ' + publishInstagramEnabled);

let manifest = null;

if (renderEnabled) {
  manifest = await renderCarousel(pkg);
  console.log('Rendered ' + manifest.slideCount + ' carousel slides using theme: ' + manifest.theme.name);
}

if (publishInstagramEnabled) {
  if (!manifest) throw new Error('Instagram publishing requires RENDER_CAROUSEL=true');

  const baseUrl = process.env.PUBLIC_ASSET_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      'PUBLIC_ASSET_BASE_URL is required for Instagram publishing. ' +
      'Meta must be able to fetch public HTTPS image URLs.'
    );
  }

  const imageUrls = manifest.files.map(function(filePath) {
    const relative = filePath.replaceAll('\\\\', '/');
    return baseUrl.replace(/\/$/, '') + '/' + relative.replace(/^artifacts\//, '');
  });

  const published = await publishCarousel(imageUrls, pkg.instagram.caption);
  await fs.writeFile(
    outputDir + '/instagram-publish.json',
    JSON.stringify(published, null, 2)
  );
  console.log('Instagram carousel published: ' + (published.id || 'ok'));
}
