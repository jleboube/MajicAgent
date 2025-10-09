const express = require('express');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { authenticate } = require('../middleware/auth');
const { activateLeadFlow } = require('../services/agentFlowService');

const router = express.Router();

// List leads for organization
router.get('/', authenticate, async (req, res) => {
  try {
    const organizationId = req.auth.user.organization;
    const leads = await Lead.find({ organization: organizationId })
      .sort({ updatedAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('Lead list error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create lead
router.post(
  '/',
  authenticate,
  body('contact.firstName').isLength({ min: 1 }).withMessage('First name required'),
  body('contact.lastName').isLength({ min: 1 }).withMessage('Last name required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const lead = new Lead({
        ...req.body,
        organization: req.auth.user.organization,
        owner: req.auth.user._id,
        assignees: [req.auth.user._id]
      });
      await lead.save();

      try {
        await activateLeadFlow(req.auth.user, lead);
      } catch (flowError) {
        console.warn('Lead flow activation warning:', flowError.message);
      }

      res.status(201).json(lead);
    } catch (error) {
      console.error('Lead create error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// Update lead
router.put(
  '/:id',
  authenticate,
  async (req, res) => {
    try {
      const lead = await Lead.findOneAndUpdate(
        { _id: req.params.id, organization: req.auth.user.organization },
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );

      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }

      res.json(lead);
    } catch (error) {
      console.error('Lead update error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
