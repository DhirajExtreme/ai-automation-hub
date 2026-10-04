# Setup checklist

## Adobe Express master template for AI Automation Hub

The supplied background image has been uploaded to the connected Adobe Creative Cloud storage as image(9).png.

Use one master Adobe Express document for the 7-page Instagram carousel.

**Canvas:** 1080 x 1350, 4:5 portrait.

**Background:** place image(9).png as a full-bleed background on all 7 pages. Keep the ED logo and technology artwork intact.

**Story text panel:** on pages 2 through 6, add one large dark translucent rounded rectangle in the center. This panel should cover the large center wording already present in the background and become the readable zone for dynamic news text. Keep the top logo/header and lower robotic-hand area visible.

**Static brand elements:** keep the ED logo, AI AUTOMATION HUB title, and AUTOMATE • LEARN • GROW tagline untagged.

### Exact tags

Page 1:
- cover_date
- cover_title

Pages 2-6:
- story_number
- story_headline
- story_summary
- story_why
- story_source

Reuse the same story tag names on each story page. The runtime uses pageOverrides so one API call fills all five story pages.

Page 7:
- final_takeaway
- final_cta

### Recommended story-page hierarchy

1. Story number, such as 01/05
2. Headline, maximum about 2 to 3 lines
3. Summary, 2 to 4 short lines
4. Why it matters, 2 to 4 short lines
5. Source name, small footer text

Do not put the full source URL inside the artwork.

### Runtime behavior

The GitHub Action now supports:
- research and Gemini editorial generation
- Adobe tagged-document validation
- one asynchronous Adobe Create Variation request for all 7 pages
- JPEG renditions for pages 1-7
- a persisted Express document output
- a 7-page PDF output
- optional Instagram carousel publication

Adobe's current Create Variation API supports typed mappings, per-page overrides, and image/document/PDF/video outputs. It is asynchronous and currently beta.

### Render test

Run the workflow manually with:
- dry_run = false
- verify_adobe = true
- render_adobe = true
- publish_instagram = false

This tests research -> template validation -> 7-page Adobe render without publishing.

### Scheduling

The daily 08:00 Asia/Kolkata schedule currently keeps Adobe rendering off until the master template and beta access are confirmed.

After the first successful render test, change the scheduled environment so RENDER_ADOBE=true. After an end-to-end Meta fetch test succeeds, enable Instagram publishing.

## Instagram

The planned path is:
Adobe 7-page render -> 7 image URLs -> 7 Instagram item containers -> carousel container -> publish.

## YouTube

The next stage is a separate animated Express master document for the Short. Adobe's beta API supports video outputs for pages that support video export, but the video surface has beta limitations.
