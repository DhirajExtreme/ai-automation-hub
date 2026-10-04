# AI Automation Hub - Daily AI News Engine

Fully automated daily AI news content pipeline for Instagram and YouTube.

## Target pipeline

GitHub Actions -> News/RSS -> Gemini -> editorial JSON -> Adobe Express API -> Instagram carousel + YouTube Short -> notifications

## Current status

- Scheduler: GitHub Actions
- Editorial AI: Gemini API
- Adobe: Express API adapter (requires Adobe Express API beta access + API credentials)
- Instagram: official Instagram API with Instagram Login
- YouTube: YouTube Data API v3
- Notification: optional Telegram
- No Buffer / n8n / Make / Zapier required

## Daily output

1. Seven-slide Instagram carousel, 1080x1350
2. 40-60 second YouTube Short, 1080x1920
3. Instagram caption
4. YouTube title, description and tags
5. Source manifest for every story

## Safety/quality gates

- Exactly 5 stories
- Major developments only
- No duplicate stories
- Source attribution required
- Reject unsupported claims
- Prefer primary sources and reputable reporting
- Do not publish if fewer than 5 stories pass validation

## Setup

See `docs/SETUP.md`.
