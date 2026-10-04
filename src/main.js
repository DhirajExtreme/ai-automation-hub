import fs from 'node:fs/promises';
import { collectResearch } from './research.js';
import { generateEditorialPackage } from './gemini.js';
import { validatePackage } from './validate.js';

const dryRun = process.env.DRY_RUN !== 'false';
const outputDir = 'artifacts';

const research = await collectResearch();
const pkg = await generateEditorialPackage(research);
validatePackage(pkg);

await fs.mkdir(outputDir, {recursive:true});
await fs.writeFile(`${outputDir}/daily.json`, JSON.stringify(pkg, null, 2));
await fs.writeFile(`${outputDir}/sources.json`, JSON.stringify(
  pkg.stories.map(({headline, sourceName, sourceUrl}) => ({headline, sourceName, sourceUrl})),
  null, 2
));

console.log(`Validated ${pkg.stories.length} stories for ${pkg.date}`);
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

if (!dryRun) {
  throw new Error('LIVE publishing is intentionally disabled until Adobe media generation, public asset hosting, Instagram publishing and YouTube rendering are configured.');
}
