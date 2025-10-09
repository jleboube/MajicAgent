const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const MessengerCadence = require('../models/MessengerCadence');

const router = express.Router();

router.get('/cadences', authenticate, async (req, res) => {
  try {
    const organizationId = req.auth.user.organization?._id || req.auth.user.organization;
    const cadences = await MessengerCadence.find({ organization: organizationId }).sort({ updatedAt: -1 });
    res.json(cadences);
  } catch (error) {
    console.error('Messenger cadences fetch error:', error.message);
    res.status(500).json({ msg: 'Unable to load messenger cadences' });
  }
});

router.post(
  '/cadences',
  authenticate,
  body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('templateBody').isLength({ min: 10 }).withMessage('Message body must be at least 10 characters'),
  body('delayMinutes').optional().isInt({ min: 0 }).withMessage('Delay must be 0 or greater'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const organizationId = req.auth.user.organization?._id || req.auth.user.organization;
      const payload = {
        ...req.body,
        organization: organizationId,
        owner: req.auth.user._id
      };

      const cadence = new MessengerCadence(payload);
      await cadence.save();
      res.status(201).json(cadence);
    } catch (error) {
      console.error('Messenger cadence create error:', error.message);
      if (error.code === 11000) {
        return res.status(409).json({ msg: 'Cadence name already exists' });
      }
      res.status(500).json({ msg: 'Unable to create messenger cadence' });
    }
  }
);

router.patch('/cadences/:id', authenticate, async (req, res) => {
  try {
    const organizationId = req.auth.user.organization?._id || req.auth.user.organization;
    const cadence = await MessengerCadence.findOneAndUpdate(
      { _id: req.params.id, organization: organizationId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!cadence) {
      return res.status(404).json({ msg: 'Cadence not found' });
    }

    res.json(cadence);
  } catch (error) {
    console.error('Messenger cadence update error:', error.message);
    res.status(500).json({ msg: 'Unable to update messenger cadence' });
  }
});

router.post(
  '/cadences/from-copy',
  authenticate,
  body('copy').notEmpty().withMessage('copy payload required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const organizationId = req.auth.user.organization?._id || req.auth.user.organization;
      const { listingId = null, copy, channel = 'email' } = req.body;
      if (!copy.emailBody) {
        return res.status(400).json({ msg: 'copy.emailBody is required' });
      }

      const cadence = new MessengerCadence({
        organization: organizationId,
        owner: req.auth.user._id,
        name: `Listing Copy ${Date.now()}`,
        description: 'Generated from listing marketing copy',
        channel,
        triggerType: 'manual',
        triggerValue: listingId,
        delayMinutes: 0,
        templateSubject: copy.emailSubject || 'New listing update',
        templateBody: copy.emailBody,
        status: 'active'
      });

      await cadence.save();
      res.status(201).json(cadence);
    } catch (error) {
      console.error('Messenger cadence copy error:', error.message);
      res.status(500).json({ msg: 'Unable to create cadence from copy' });
    }
  }
);

module.exports = router;
