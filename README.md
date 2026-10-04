# AI Automation Hub - Daily AI News Engine

Fully automated daily AI news content pipeline for Instagram and YouTube.

## Pipeline

GitHub Actions -> News/RSS -> Gemini -> validation -> original HTML/CSS carousel renderer -> Instagram publishing + YouTube workflow

No Adobe API is required at runtime.

## Design system

The carousel uses 10 original HTML/CSS visual themes inspired by current Adobe Express technology, AI, cybersecurity, robotics, cloud, coding, fintech and futuristic template aesthetics. The project does not copy Adobe template artwork into runtime assets.

Canvas:
- Instagram carousel: 1080x1350
- 7 slides per daily package

The theme rotates deterministically by date and can be overridden with CAROUSEL_THEME.

## Daily output

1. Seven-slide Instagram carousel
2. 40-60 second YouTube Short editorial script
3. Instagram caption
4. YouTube metadata
5. Source manifest
6. Theme manifest

## Quality gates

- Exactly 5 stories
- Major developments only
- No duplicates
- Source attribution required
- No invented facts
- No publication when required inputs are missing

## Runtime publishing

Instagram's publishing API requires public HTTPS image URLs. The HTML/CSS renderer therefore produces the images first, while publication remains disabled until PUBLIC_ASSET_BASE_URL points to a public asset host.

## Setup

See docs/SETUP.md.
