import fs from 'node:fs/promises';
import { collectResearch } from './research.js';
import { generateEditorialPackage } from './gemini.js';
import { validatePackage } from './validate.js';
import { createAdobeVariation, getTaggedDocument, pollAdobe } from './adobe.js';
import {
  buildAdobeCarouselRequest,
  extractAdobeImageUrls,
  validateAdobeTagContract
} from './carousel.js';
import { publishCarousel } from './instagram.js';

const dryRun = process.env.DRY_RUN !== 'false';
const renderAdobe = process.env.RENDER_ADOBE === 'true';
const publishInstagram = process.env.PUBLISH_INSTAGRAM === 'true';
const outputDir = 'artifacts';

const research = await collectResearch();
const pkg = await generateEditorialPackage(research);
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
console.log('Adobe render: ' + renderAdobe);
console.log('Instagram publish: ' + publishInstagram);

if (!dryRun && renderAdobe) {
  const detail = await getTaggedDocument(process.env.ADOBE_TEMPLATE_ID);
  validateAdobeTagContract(detail);

  const request = buildAdobeCarouselRequest(pkg);
  const submitted = await createAdobeVariation(request);
  console.log('Adobe job started: ' + submitted.jobId);

  const result = await pollAdobe(submitted.statusUrl);
  await fs.writeFile(
    outputDir + '/adobe-variation.json',
    JSON.stringify(result, null, 2)
  );

  if (result.status === 'failed') {
    throw new Error('Adobe variation failed: ' + JSON.stringify(result.errors || result));
  }

  const imageUrls = extractAdobeImageUrls(result);
  if (imageUrls.length !== 7) {
    throw new Error('Expected 7 Adobe carousel images, received ' + imageUrls.length);
  }

  await fs.writeFile(
    outputDir + '/instagram-media.json',
    JSON.stringify(imageUrls, null, 2)
  );

  if (publishInstagram) {
    const published = await publishCarousel(
      imageUrls.map(function(item) { return item.url; }),
      pkg.instagram.caption
    );
    await fs.writeFile(
      outputDir + '/instagram-publish.json',
      JSON.stringify(published, null, 2)
    );
    console.log('Instagram carousel published: ' + (published.id || 'ok'));
  }
}

if (!dryRun && !renderAdobe) {
  throw new Error(
    'LIVE mode requires RENDER_ADOBE=true. This prevents accidental publishing without an Adobe render.'
  );
}
