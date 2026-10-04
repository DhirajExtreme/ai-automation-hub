# AI Automation Hub setup

## 1. Gemini

Repository variable:
- GEMINI_MODEL

Repository secret:
- GEMINI_API_KEY

The Gemini consumer subscription and Gemini API billing are separate.

## 2. HTML/CSS carousel renderer

The Adobe Express API has been removed from the runtime flow.

The renderer creates all 7 carousel pages from:
- templates/carousel.css
- config/themes.json
- src/render.js

The daily package selects one of the 10 themes. Set CAROUSEL_THEME locally to force a specific theme.

The design canvas is 1080 x 1350 (4:5).

The renderer creates:
- artifacts/carousel/slide-01.jpg through slide-07.jpg
- artifacts/ai-automation-hub-daily.pdf
- artifacts/carousel-manifest.json

The layout is original HTML/CSS and uses no external image dependency.

## 3. Adobe inspiration library

The 10 themes were selected from Adobe Express technology-focused design searches for:
- AI and futuristic tech
- cybersecurity
- robotics
- cloud/data
- coding/developer
- quantum
- semiconductors
- fintech
- AI agents/automation
- futuristic innovation

Only visual cues such as dark backgrounds, neon accents, grids, glass panels and technical geometry are carried into the original CSS system.

## 4. Instagram

Secrets:
- INSTAGRAM_USER_ID
- INSTAGRAM_ACCESS_TOKEN

Variable:
- PUBLIC_ASSET_BASE_URL

PUBLIC_ASSET_BASE_URL must point to a public HTTPS location that serves the generated JPEG files.

The planned publication flow is:

HTML/CSS render -> public asset hosting -> 7 Instagram media containers -> carousel container -> publish.

Publishing is disabled by default.

## 5. YouTube

The existing YouTube OAuth uploader remains in the project:
- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN

The editorial engine already creates a 40-60 second script and metadata. A separate video rendering stage can feed the existing uploader.

## 6. First trial

Run the GitHub workflow manually with:

render_carousel = true
publish_instagram = false

The first successful run should produce 7 JPEG pages plus the PDF as workflow artifacts.

Do not enable Instagram publishing until the rendered pages are visually checked and a public asset host is configured.

## 7. Daily schedule

GitHub Actions runs daily at 08:00 Asia/Kolkata.

The scheduled run renders the carousel automatically and keeps Instagram publishing disabled until you explicitly enable it in the workflow.
