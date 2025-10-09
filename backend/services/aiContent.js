const { OpenAI } = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function parseJsonString(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    console.error('JSON parse error:', error.message);
    return null;
  }
}

function buildListingPrompt({ listing, agentName }) {
  const { address, description, propertyDetails } = listing;
  const details = [
    `${address.street1}${address.street2 ? ` ${address.street2}` : ''}`,
    `${address.city}, ${address.state} ${address.postalCode}`,
    description || 'No prior description provided.'
  ];

  if (propertyDetails?.bedrooms || propertyDetails?.bathrooms || propertyDetails?.squareFeet) {
    details.push(
      `Specs: ${propertyDetails.bedrooms || '?'} beds, ${propertyDetails.bathrooms || '?'} baths, ${propertyDetails.squareFeet || '?'} sq ft.`
    );
  }

  return `You are assisting real estate agent ${agentName}.
Property overview:
${details.join('\n')}

Create:
1. A 600 character MLS description.
2. A short social media caption with 3 relevant hashtags.
3. An email subject line and body for nurturing warm buyers.

Respond as JSON with keys mlsDescription, socialCaption, emailSubject, emailBody.`;
}

async function callOpenAI(prompt) {
  if (!openaiClient) return null;

  const response = await openaiClient.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  const rawText = response.output_text?.trim() ?? response.output?.[0]?.content?.[0]?.text?.trim();
  return parseJsonString(rawText);
}

async function callAnthropic(prompt) {
  if (!anthropicClient) return null;

  const response = await anthropicClient.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 600,
    temperature: 0.7,
    system: 'Return JSON only. Use the provided keys.',
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response?.content?.[0]?.text?.trim();
  return parseJsonString(text);
}

function fallbackListingCopy(listing, agentName) {
  const address = `${listing.address?.street1 || ''}${listing.address?.street2 ? ` ${listing.address.street2}` : ''}, ${listing.address?.city || ''}`.trim();
  const beds = listing.propertyDetails?.bedrooms ? `${listing.propertyDetails.bedrooms} bed` : null;
  const baths = listing.propertyDetails?.bathrooms ? `${listing.propertyDetails.bathrooms} bath` : null;
  const sqft = listing.propertyDetails?.squareFeet ? `${listing.propertyDetails.squareFeet.toLocaleString()} sq ft` : null;
  const specLine = [beds, baths, sqft].filter(Boolean).join(' · ');
  const summary = listing.description || 'Beautifully maintained home ready for its next owner.';

  return {
    mlsDescription: `${summary} Located at ${address}, this property offers ${specLine || 'flexible living space'} along with modern updates and a layout perfect for everyday living and entertaining. Schedule your private showing today to experience the home in person!`,
    socialCaption: `${address} is on the market! ${specLine ? `${specLine} · ` : ''}Swipe to see highlights and book a tour. #${listing.address?.city?.replace(/\s+/g, '') || 'realestate'} #newlisting #majicagent`,
    emailSubject: `Tour ${address} this week`,
    emailBody: `Hi there,\n\nI wanted to share our latest listing at ${address}. ${summary} ${specLine ? `It offers ${specLine}. ` : ''}If you'd like to walk through or need more details, just reply to this email and I'll set everything up.\n\nBest,\n${agentName}`
  };
}

async function generateListingCopy({ listing, agentName }) {
  const prompt = buildListingPrompt({ listing, agentName });

  try {
    const openaiResult = await callOpenAI(prompt);
    if (openaiResult) return openaiResult;

    const anthropicResult = await callAnthropic(prompt);
    if (anthropicResult) return anthropicResult;
  } catch (error) {
    console.error('AI generation error:', error.message);
  }

  return fallbackListingCopy(listing, agentName);
}

module.exports = {
  generateListingCopy,
  hasOpenAI: () => Boolean(openaiClient),
  hasAnthropic: () => Boolean(anthropicClient),
  callOpenAICompletion: async (prompt) => {
    if (!openaiClient) {
      throw new Error('OpenAI not configured');
    }

    const response = await openaiClient.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature: 0.7
    });

    return response.output_text?.trim() || response.output?.[0]?.content?.[0]?.text?.trim();
  }
};
