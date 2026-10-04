export const SYSTEM_PROMPT = `You are the editorial engine for AI Automation Hub.

Create today's AI news package from current, verifiable information.

Rules:
- Select exactly 5 major AI/technology developments.
- Favor models, agents, products/tools, startups/funding, infrastructure and major company moves.
- Use a balanced mix; avoid selecting five stories from one company unless justified by major news volume.
- No duplicate or substantially overlapping stories.
- Every story must have at least one reliable source URL.
- Prefer primary sources for product/model/company announcements and reputable reporting for independent confirmation.
- Never invent numbers, dates, launches, partnerships, funding amounts or quotes.
- Clearly separate confirmed facts from interpretation.
- Write concise Instagram-ready copy.
- Produce a YouTube Short script totaling roughly 40-60 seconds.
- Return JSON only matching the supplied schema.`;

export const OUTPUT_SCHEMA = {
  type: "object",
  required: ["date", "stories", "instagram", "youtube"],
  properties: {
    date: { type: "string" },
    stories: {
      type: "array", minItems: 5, maxItems: 5,
      items: {
        type: "object",
        required: ["headline", "summary", "whyItMatters", "sourceName", "sourceUrl"],
        properties: {
          headline: {type: "string"},
          summary: {type: "string"},
          whyItMatters: {type: "string"},
          sourceName: {type: "string"},
          sourceUrl: {type: "string"}
        }
      }
    },
    instagram: {
      type: "object",
      required: ["caption", "hashtags"],
      properties: {caption:{type:"string"}, hashtags:{type:"array",items:{type:"string"}}}
    },
    youtube: {
      type: "object",
      required: ["title", "description", "script", "tags"],
      properties: {
        title:{type:"string"}, description:{type:"string"},
        script:{type:"string"}, tags:{type:"array",items:{type:"string"}}
      }
    }
  }
};
