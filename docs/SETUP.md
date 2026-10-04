# Setup checklist

## 1. GitHub

Create a private GitHub repository and upload this project.
Enable Actions.

Required GitHub Secrets:

- GEMINI_API_KEY
- ADOBE_API_KEY
- ADOBE_ACCESS_TOKEN
- ADOBE_TEMPLATE_ID
- INSTAGRAM_USER_ID
- INSTAGRAM_ACCESS_TOKEN
- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN
- TELEGRAM_BOT_TOKEN (optional)
- TELEGRAM_CHAT_ID (optional)

## 2. Gemini

Create a Gemini API key and use a current Gemini model available to your account. The consumer Gemini subscription and Gemini API billing are separate; verify API access before relying on paid API quotas.

## 3. Adobe Express

Adobe Express API is currently beta. Request access through Adobe's Express API program, create an Adobe Developer Console project, obtain the API key/access token, and create/tag the master Express template.

Recommended tags:

- cover_date
- cover_subtitle
- story_1_headline
- story_1_summary
- story_1_why
- story_1_source
- story_2_headline
- story_2_summary
- story_2_why
- story_2_source
- story_3_headline
- story_3_summary
- story_3_why
- story_3_source
- story_4_headline
- story_4_summary
- story_4_why
- story_4_source
- story_5_headline
- story_5_summary
- story_5_why
- story_5_source
- final_takeaway
- final_cta

## 4. Instagram

Use an Instagram Professional account (Business or Creator). Configure an Instagram API with Instagram Login application and obtain the current publishing permission/token. The publisher expects public HTTPS image URLs.

Carousel flow: create 7 item containers -> create carousel container -> publish carousel.

## 5. YouTube

Create a Google Cloud project, enable YouTube Data API v3, configure OAuth, and obtain a refresh token with `youtube.upload` scope. Store the refresh token as a GitHub secret.

Important: Google states that uploads from unverified API projects created after July 28, 2020 are restricted to private viewing until the project passes the required audit.

## 6. Scheduling

The workflow is scheduled for 08:00 Asia/Kolkata using GitHub Actions timezone-aware scheduling.

## 7. First run

Run the workflow manually with `DRY_RUN=true`. Review `artifacts/daily.json`, carousel assets, and publishing payloads. Then enable live publishing.
