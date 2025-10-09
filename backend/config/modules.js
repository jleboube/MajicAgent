const modules = [
  {
    slug: 'majic-photo',
    name: 'Majic Photo Studio',
    shortDescription: 'AI-powered virtual staging and photo enhancements ready for every listing.',
    longDescription:
      'Upload room photos, apply premium staging presets, and syndicate the results to MLS, social media, and your marketing channels without leaving MajicAgent.',
    category: 'marketing',
    docsUrl: 'https://majicagent.com/docs/photo',
    status: 'available',
    actions: [
      { label: 'Open Photo Studio', type: 'internal', path: '/modules/photo' },
      { label: 'View API Docs', type: 'external', url: 'https://majicagent.com/docs/api/photo' }
    ]
  },
  {
    slug: 'majic-listing-agent',
    name: 'Listing Command Center',
    shortDescription: 'Coordinate tasks, documents, and marketing copy across every transaction.',
    longDescription:
      'Centralize listing requirements, auto-generate MLS & social copy, and assign tasks to teammates so every launch stays on track.',
    category: 'operations',
    docsUrl: 'https://majicagent.com/docs/listings',
    status: 'beta',
    actions: [
      { label: 'Manage Listings', type: 'internal', path: '/modules/listings' },
      { label: 'View Docs', type: 'external', url: 'https://majicagent.com/docs/listings' }
    ]
  },
  {
    slug: 'majic-messenger',
    name: 'Majic Messenger',
    shortDescription: 'Engage leads with orchestrated email and SMS cadences powered by AI.',
    longDescription:
      'Build omnichannel playbooks that react to lead behavior, send automated follow-ups, and keep clients informed without manual effort.',
    category: 'communication',
    docsUrl: 'https://majicagent.com/docs/messenger',
    status: 'beta',
    actions: [
      { label: 'Open Messenger', type: 'internal', path: '/modules/messenger' },
      { label: 'Docs', type: 'external', url: 'https://majicagent.com/docs/messenger' }
    ]
  },
  {
    slug: 'majic-insights',
    name: 'Market Insights',
    shortDescription: 'Predict listings, track portfolio performance, and surface warm opportunities.',
    longDescription:
      'Use predictive analytics and portfolio dashboards to uncover likely sellers, retention risks, and the next best action for your pipeline.',
    category: 'intelligence',
    docsUrl: 'https://majicagent.com/docs/insights',
    status: 'beta',
    actions: [
      { label: 'Open Insights', type: 'internal', path: '/modules/insights' },
      { label: 'Preview Insights', type: 'external', url: 'https://majicagent.com/insights' }
    ]
  }
];

module.exports = {
  modules
};
