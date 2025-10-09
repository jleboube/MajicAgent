const N8N_SERVER = process.env.N8N_SERVER;
const N8N_USER = process.env.N8N_USER;
const N8N_KEY = process.env.N8N_KEY;
const WORKFLOW_ENDPOINTS = {
  lead_created: process.env.N8N_LEAD_WORKFLOW || '/webhook/lead-created',
  listing_created: process.env.N8N_LISTING_WORKFLOW || '/webhook/listing-created'
};

function isConfigured() {
  return Boolean(N8N_SERVER && N8N_KEY);
}

async function triggerWorkflow(workflowKey, payload) {
  if (!isConfigured()) {
    return;
  }

  const endpoint = WORKFLOW_ENDPOINTS[workflowKey];
  if (!endpoint) {
    return;
  }

  const url = new URL(endpoint, N8N_SERVER).toString();

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_KEY
    };
    if (N8N_USER) {
      headers.Authorization = `Basic ${Buffer.from(`${N8N_USER}:${N8N_KEY}`).toString('base64')}`;
    }

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ workflow: workflowKey, payload })
    });
  } catch (error) {
    console.warn(`n8n workflow ${workflowKey} failed:`, error.message);
  }
}

module.exports = {
  isConfigured,
  triggerWorkflow
};
