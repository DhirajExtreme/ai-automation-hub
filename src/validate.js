export function validatePackage(pkg) {
  if (!pkg?.stories || pkg.stories.length !== 5) {
    throw new Error('Editorial package must contain exactly 5 stories');
  }
  const seen = new Set();
  for (const s of pkg.stories) {
    if (!s.headline || !s.summary || !s.whyItMatters || !s.sourceUrl) {
      throw new Error(`Incomplete story: ${s.headline || 'unknown'}`);
    }
    const key = s.headline.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).slice(0, 7).join(' ');
    if (seen.has(key)) throw new Error(`Duplicate story detected: ${s.headline}`);
    seen.add(key);
  }
  return true;
}
