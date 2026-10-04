# Setup checklist

## 1. GitHub

Create a private GitHub repository and enable Actions.

### Repository secrets

- GEMINI_API_KEY
- ADOBE_CLIENT_ID
- ADOBE_CLIENT_SECRET
- ADOBE_TEMPLATE_ID
- INSTAGRAM_USER_ID
- INSTAGRAM_ACCESS_TOKEN
- YOUTUBE_CLIENT_ID
- YOUTUBE_CLIENT_SECRET
- YOUTUBE_REFRESH_TOKEN
- TELEGRAM_BOT_TOKEN (optional)
- TELEGRAM_CHAT_ID (optional)

### Repository variables

- GEMINI_MODEL
- ADOBE_SCOPE

Do not commit API keys, client secrets, OAuth refresh tokens, or Adobe access tokens to the repository.

## 2. Gemini

Create a Gemini API key and use a current Gemini model available to your account. The consumer Gemini subscription and Gemini API billing are separate; verify API access before relying on paid API quotas.

## 3. Adobe Express API

The current Adobe Express API setup is documented at the Adobe Firefly Services developer site.

1. Request/obtain Adobe Express API beta access.
2. In Adobe Developer Console, add **Adobe Express API**.
3. Use **OAuth Server-to-Server** for this GitHub Actions backend.
4. Assign the product profiles required by Adobe. Adobe currently documents access that includes Adobe Express, Adobe Firefly Services, and non-Premium Fonts.
5. Copy the credential's **Client ID** and **Client Secret**.
6. Copy the exact **Scopes** shown for your credential into the GitHub repository variable `ADOBE_SCOPE`.
7. Note the **Technical Account Email**.
8. Share the master Express document with that technical account and grant at least the minimum permission required, typically **Can edit**.
9. Create/tag the master Express document.

Adobe Server-to-Server uses the OAuth 2.0 `client_credentials` grant. The GitHub workflow generates a fresh access token at run time, so a temporary generated access token does not need to be stored as a GitHub secret.

### Adobe credentials mapping

- Adobe **Client ID** -> GitHub Secret `ADOBE_CLIENT_ID`
- Adobe **Client Secret** -> GitHub Secret `ADOBE_CLIENT_SECRET`
- Adobe **Scopes** -> GitHub Variable `ADOBE_SCOPE`
- Tagged document ID -> GitHub Secret `ADOBE_TEMPLATE_ID`

### Recommended document tags

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

### Adobe verification

After adding the Client ID, Client Secret and Scope:

**Actions -> Daily AI News -> Run workflow -> Verify Adobe Express connection = true**

The workflow will request a fresh OAuth access token and call `GET /beta/tagged-documents`. It will list the tagged documents visible to the technical account.

The current Create Variation API is:

`POST https://express-api.adobe.io/beta/create-variation`

It accepts a `templateOrDocument.creativeCloudFileId`, typed mappings under `input.mappings`, and an `outputs` array. The job is asynchronous and returns a `jobId` and `statusUrl`.

## 4. Instagram

Use an Instagram Professional account (Business or Creator). Configure the official Instagram API publishing permissions and obtain the publishing token. The publisher expects public HTTPS image URLs.

Carousel flow: create 7 item containers -> create carousel container -> publish carousel.

## 5. YouTube

Create a Google Cloud project, enable YouTube Data API v3, configure OAuth, and obtain a refresh token with `youtube.upload` scope. Store the refresh token as a GitHub secret.

Important: Google states that uploads from unverified API projects can be restricted to private viewing until the project passes the required audit.

## 6. Scheduling

The workflow is scheduled for 08:00 Asia/Kolkata using GitHub Actions timezone-aware scheduling.

## 7. First run

Run the workflow manually with `DRY_RUN=true`. Review `artifacts/daily.json`.

For an Adobe connection test, use `verify_adobe=true`. Do not enable live publishing until the complete Adobe -> asset hosting -> Instagram/YouTube path has been tested and Adobe beta-use restrictions have been checked.
