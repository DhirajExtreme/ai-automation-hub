const feeds = [
  'https://www.theverge.com/rss/index.xml',
  'https://techcrunch.com/category/artificial-intelligence/feed/',
  'https://www.technologyreview.com/feed/',
  'https://blog.google/technology/ai/rss/',
  'https://openai.com/news/rss.xml'
];

export async function collectResearch() {
  const chunks = [];
  for (const url of feeds) {
    try {
      const r = await fetch(url, {headers:{'user-agent':'AI-Automation-Hub/1.0'}});
      if (!r.ok) continue;
      const text = await r.text();
      chunks.push(`SOURCE FEED: ${url}\n${text.slice(0, 30000)}`);
    } catch (error) {
      console.warn(`Feed unavailable: ${url}: ${error.message}`);
    }
  }
  if (!chunks.length) throw new Error('No research feeds available');
  return chunks.join('\n\n');
}
