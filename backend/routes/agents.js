const express = require('express');
const { authenticate } = require('../middleware/auth');
const { modules } = require('../config/modules');
const { getAgentProfile, updateAgentProfile, ensureAgentProfile } = require('../services/agentProfileService');

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.auth.user;
    const profile = req.auth.agentProfile || (await ensureAgentProfile(user));

    res.json({
      profile,
      modules: {
        available: modules,
        enabled: profile?.enabledModules ?? []
      }
    });
  } catch (error) {
    console.error('Agent profile fetch error:', error.message);
    res.status(500).json({ msg: 'Unable to load agent profile' });
  }
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.enabledModules) {
      updates.enabledModules = updates.enabledModules.filter((slug) => modules.some((module) => module.slug === slug));
    }

    const profile = await updateAgentProfile(req.auth.user._id, updates);
    res.json(profile);
  } catch (error) {
    console.error('Agent profile update error:', error.message);
    res.status(500).json({ msg: 'Unable to update agent profile' });
  }
});

router.get('/modules', authenticate, async (req, res) => {
  res.json(modules);
});

module.exports = router;
