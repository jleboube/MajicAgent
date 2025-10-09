const express = require('express');
const { authenticate } = require('../middleware/auth');
const { hasOpenAI, hasAnthropic } = require('../services/aiContent');
const { runBuyerIntakePrompt, runListingFlowPrompt } = require('../services/aiWorkflowsService');
const { isConfigured: isN8nConfigured } = require('../services/n8nService');

const router = express.Router();

router.get('/status', authenticate, async (req, res) => {
  res.json({
    openai: hasOpenAI(),
    anthropic: hasAnthropic(),
    n8n: isN8nConfigured()
  });
});

router.post('/buyer-intake', authenticate, async (req, res) => {
  try {
    const { conversation = [] } = req.body || {};
    const response = await runBuyerIntakePrompt(conversation);
    res.json(response);
  } catch (error) {
    console.error('Buyer intake workflow error:', error.message);
    res.status(500).json({ msg: 'Buyer intake AI workflow failed', error: error.message });
  }
});

router.post('/listing-guide', authenticate, async (req, res) => {
  try {
    const { listingId } = req.body;
    const response = await runListingFlowPrompt(req.auth.user, listingId);
    res.json(response);
  } catch (error) {
    console.error('Listing guide workflow error:', error.message);
    res.status(500).json({ msg: 'Listing guide AI workflow failed', error: error.message });
  }
});

module.exports = router;
