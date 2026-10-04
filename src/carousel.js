const STORY_PAGE_START = 2;

function textMappingsForStory(index, story) {
  return [
    { tagName: 'story_number', text: '0' + index + '/05' },
    { tagName: 'story_headline', text: story.headline },
    { tagName: 'story_summary', text: story.summary },
    { tagName: 'story_why', text: story.whyItMatters },
    { tagName: 'story_source', text: story.sourceName }
  ];
}

export function buildAdobeCarouselRequest(pkg) {
  const pageOverrides = [
    {
      pageNumber: 1,
      mappings: {
        textMappings: [
          { tagName: 'cover_date', text: pkg.date },
          { tagName: 'cover_title', text: '5 BIGGEST AI STORIES TODAY' }
        ]
      }
    }
  ];

  for (let i = 0; i < pkg.stories.length; i++) {
    pageOverrides.push({
      pageNumber: STORY_PAGE_START + i,
      mappings: {
        textMappings: textMappingsForStory(i + 1, pkg.stories[i])
      }
    });
  }

  pageOverrides.push({
    pageNumber: 7,
    mappings: {
      textMappings: [
        {
          tagName: 'final_takeaway',
          text: pkg.stories.map(function(s, i) {
            return (i + 1) + '. ' + s.headline;
          }).join(' • ')
        },
        {
          tagName: 'final_cta',
          text: 'Follow AI Automation Hub for the next AI Daily.'
        }
      ]
    }
  });

  return {
    pageOverrides,
    outputs: [
      {
        type: 'image',
        mediaType: 'image/jpeg',
        size: 1350,
        pages: '1-7'
      },
      {
        type: 'document',
        preferredDocumentName: 'AI Automation Hub - AI Daily - ' + pkg.date
      },
      {
        type: 'pdf',
        pdfType: 'standard',
        pages: '1-7'
      }
    ],
    variationRequestId: 'ai-daily-' + pkg.date
  };
}

export function extractAdobeImageUrls(result) {
  return (result.outputs || [])
    .filter(function(item) {
      return item.type === 'image' && item.destination && item.destination.url;
    })
    .sort(function(a, b) {
      return (a.pageNumber || 0) - (b.pageNumber || 0);
    })
    .map(function(item) {
      return { pageNumber: item.pageNumber, url: item.destination.url };
    });
}

export function validateAdobeTagContract(detail) {
  const pages = detail.pages || [];
  const required = {
    1: ['cover_date', 'cover_title'],
    2: ['story_number', 'story_headline', 'story_summary', 'story_why', 'story_source'],
    3: ['story_number', 'story_headline', 'story_summary', 'story_why', 'story_source'],
    4: ['story_number', 'story_headline', 'story_summary', 'story_why', 'story_source'],
    5: ['story_number', 'story_headline', 'story_summary', 'story_why', 'story_source'],
    6: ['story_number', 'story_headline', 'story_summary', 'story_why', 'story_source'],
    7: ['final_takeaway', 'final_cta']
  };

  const failures = [];

  for (const pageText of Object.keys(required)) {
    const pageNumber = Number(pageText);
    const page = pages.find(function(p) {
      return Number(p.pageNumber) === pageNumber;
    });
    const present = new Set(
      (page && page.taggedElements || []).map(function(e) { return e.name; })
    );

    for (const tag of required[pageText]) {
      if (!present.has(tag)) {
        failures.push('page ' + pageNumber + ': missing tag \''
          + tag + '\'');
      }
    }
  }

  if (failures.length) {
    throw new Error('Adobe tag contract failed:\n- ' + failures.join('\n- '));
  }

  return true;
}
