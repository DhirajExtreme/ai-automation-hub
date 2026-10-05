import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const WIDTH = 1080;
const HEIGHT = 1350;
const OUTPUT_DIR = 'artifacts/carousel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function clampText(value, max) {
  const text = String(value ?? '').trim();
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function dayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(),0,0));
  return Math.floor((date - start) / 86400000);
}

function pickTheme(themes, dateValue) {
  const override = process.env.CAROUSEL_THEME;
  if (override) {
    const found = themes.find(t => t.id === override || t.name === override);
    if (found) return found;
  }

  const parsed = new Date(String(dateValue || ''));
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const dateIndex = dayOfYear(new Date(Date.UTC(
    safeDate.getUTCFullYear(),
    safeDate.getUTCMonth(),
    safeDate.getUTCDate()
  )));

  // Use the GitHub Actions run number as an additional rotation offset.
  // Scheduled daily runs therefore move to a new theme each day, while
  // repeated same-day test runs also exercise different themes.
  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER || '0', 10);
  const runOffset = Number.isFinite(runNumber) && runNumber > 0 ? runNumber : 0;
  const index = (dateIndex + runOffset) % themes.length;

  return themes[index];
}
function themeVars(theme) {
  const p = theme.palette;
  return '--bgA:' + p.bgA + ';--bgB:' + p.bgB + ';--accent:' + p.accent +
    ';--accent2:' + p.accent2 + ';--panel:' + p.panel + ';';
}

function logoSvg(theme) {
  return '<svg class="logo ed-logo" viewBox="0 0 120 120" aria-label="ED logo" role="img">' +
    '<text x="5" y="68" font-size="58" fill="white">E</text>' +
    '<text x="54" y="68" font-size="58" fill="white">D</text>' +
    '<path d="M55 57 L66 68 L91 40" fill="none" stroke="' + theme.palette.accent2 + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="8" y="80" width="104" height="7" rx="3.5" fill="white"/>' +
    '<path d="M20 87 L15 110 M100 87 L105 110" stroke="white" stroke-width="7"/>' +
    '</svg>';
}

function decorativeMarkup() {
  return '<div class="big-five">05</div>' +
    '<div class="orbit"></div>' +
    '<div class="robot-hand">' +
      '<div class="palm"></div><div class="finger f1"></div><div class="finger f2"></div><div class="finger f3"></div>' +
    '</div>';
}

function baseHtml(css, theme, body) {
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + css +
    '</style></head><body><main class="slide" style="' + themeVars(theme) + '">' +
    body + '</main></body></html>';
}

function topbar(theme, date) {
  return '<div class="topbar">' +
    '<div class="brand">' + logoSvg(theme) +
      '<div><div class="brand-name">EVERYDAY AI DESK</div><div class="tagline">AUTOMATE • LEARN • GROW</div></div>' +
    '</div>' +
    '<div class="badge">AI DAILY · ' + escapeHtml(date) + '</div>' +
  '</div>';
}

function coverSlide(css, theme, pkg) {
  const body = topbar(theme, pkg.date) +
    '<div class="page-title">' +
      '<div class="kicker">DAILY AI NEWS</div>' +
      '<div class="cover-title">5 BIGGEST <span>AI STORIES</span><br>TO KNOW TODAY</div>' +
      '<div class="cover-sub">Five major developments in artificial intelligence and technology, curated for builders, creators and business leaders.</div>' +
      '<div class="date-pill">CURATED ' + escapeHtml(pkg.date) + '</div>' +
    '</div>' + decorativeMarkup() +
    '<div class="footer"><div class="footer-left"><span class="footer-dot"></span>REAL NEWS · CLEAR INSIGHTS</div><div class="footer-right">EVERYDAY AI DESK</div></div>';
  return baseHtml(css, theme, body);
}

function storySlide(css, theme, pkg, story, index) {
  const body = topbar(theme, pkg.date) +
    '<section class="center-panel">' +
      '<div class="story-number">STORY ' + String(index).padStart(2,'0') + ' / 05</div>' +
      '<div class="story-headline">' + escapeHtml(clampText(story.headline, 110)) + '</div>' +
      '<div class="rule"></div>' +
      '<div class="label">WHAT HAPPENED</div>' +
      '<div class="copy">' + escapeHtml(clampText(story.summary, 310)) + '</div>' +
      '<div class="why"><div class="label">WHY IT MATTERS</div><div class="copy">' +
        escapeHtml(clampText(story.whyItMatters, 250)) +
      '</div></div>' +
      '<div class="source"><span>Source</span><strong>' + escapeHtml(story.sourceName) + '</strong></div>' +
    '</section>' +
    decorativeMarkup() +
    '<div class="footer"><div class="footer-left"><span class="footer-dot"></span>INDEPENDENT NEWS EXPLAINER</div><div class="footer-right">EVERYDAY AI DESK</div></div>';
  return baseHtml(css, theme, body);
}

function finalSlide(css, theme, pkg, social) {
  const items = pkg.stories.map(function(story, i) {
    return '<div class="final-item"><div class="final-index">0' + (i+1) + '</div><div class="final-text">' +
      escapeHtml(clampText(story.headline, 92)) + '</div></div>';
  }).join('');
  const body = topbar(theme, pkg.date) +
    '<div class="page-title">' +
      '<div class="kicker">THE DAILY TAKEAWAY</div>' +
      '<div class="cover-title" style="font-size:68px">WHAT TO <span>WATCH NEXT</span></div>' +
      '<div class="small-note">The five signals worth carrying into your day.</div>' +
      '<div class="final-list">' + items + '</div>' +
      '<div class="cta cross-cta">' +
        '<div>INSTAGRAM <strong>' + escapeHtml(social.instagram.handle) + '</strong></div>' +
        '<div>X <strong>' + escapeHtml(social.x.handle) + '</strong></div>' +
        '<div>THREADS <strong>' + escapeHtml(social.threads.handle) + '</strong></div>' +
        '<div>YOUTUBE <strong>' + escapeHtml(social.youtube.channelName) + '</strong></div>' +
      '</div>' +
    '</div>' + decorativeMarkup() +
    '<div class="footer"><div class="footer-left"><span class="footer-dot"></span>AUTOMATE · LEARN · GROW</div><div class="footer-right">SEE YOU TOMORROW</div></div>';
  return baseHtml(css, theme, body);
}

export async function renderCarousel(pkg) {
  const [css, themeConfig, socialConfig] = await Promise.all([
    fs.readFile('templates/carousel.css','utf8'),
    fs.readFile('config/themes.json','utf8').then(JSON.parse),
    fs.readFile('config/social.json','utf8').then(JSON.parse)
  ]);

  const themes = themeConfig.themes;
  const social = socialConfig;
  if (!Array.isArray(themes) || themes.length < 10) {
    throw new Error('At least 10 carousel themes are required');
  }

  const theme = pickTheme(themes, pkg.date);
  await fs.rm(OUTPUT_DIR,{recursive:true,force:true});
  await fs.mkdir(OUTPUT_DIR,{recursive:true});

  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({
      viewport:{width:WIDTH,height:HEIGHT},
      deviceScaleFactor:1
    });

    const htmlPages = [];
    htmlPages.push(coverSlide(css,theme,pkg));
    for (let i=0; i<pkg.stories.length; i++) {
      htmlPages.push(storySlide(css,theme,pkg,pkg.stories[i],i+1));
    }
    htmlPages.push(finalSlide(css,theme,pkg,social));

    for (let i=0; i<htmlPages.length; i++) {
      await page.setContent(htmlPages[i], {waitUntil:'load'});
      await page.screenshot({
        path:path.join(OUTPUT_DIR,'slide-' + String(i+1).padStart(2,'0') + '.jpg'),
        type:'jpeg',
        quality:92
      });
    }

    const pdfBody = htmlPages.map(function(html) {
      const start = html.indexOf('<main class="slide"');
      const end = html.indexOf('</main>');
      if (start < 0 || end < 0) throw new Error('Unable to extract slide markup for PDF');
      return '<section class="pdf-slide">' + html.slice(start, end + '</main>'.length) + '</section>';
    }).join('');

    const pdfHtml = '<!doctype html><html><head><meta charset="utf-8"><style>@page{size:1080px 1350px;margin:0}html,body{margin:0;padding:0}.pdf-slide{width:1080px;height:1350px;break-after:page;page-break-after:always;overflow:hidden}.pdf-slide:last-child{break-after:auto;page-break-after:auto}</style></head><body>' +
      pdfBody + '</body></html>';

    await page.setContent(pdfHtml, {waitUntil:'load'});
    await page.pdf({
      path:'artifacts/ai-automation-hub-daily.pdf',
      width:'1080px',
      height:'1350px',
      printBackground:true,
      preferCSSPageSize:true
    });

    const manifest = {
      date: pkg.date,
      theme: theme,
      slideCount: htmlPages.length,
      files: htmlPages.map(function(_,i) {
        return path.join(OUTPUT_DIR,'slide-' + String(i+1).padStart(2,'0') + '.jpg');
      })
    };
    await fs.writeFile('artifacts/carousel-manifest.json',JSON.stringify(manifest,null,2));
    return manifest;
  } finally {
    await browser.close();
  }
}
