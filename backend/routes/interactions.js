const express = require('express');
const { body, validationResult } = require('express-validator');
const Interaction = require('../models/Interaction');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const interactions = await Interaction.find({ organization: req.auth.user.organization })
      .populate('lead', 'contact')
      .populate('author', 'displayName email')
      .sort({ occurredAt: -1 })
      .limit(200);
    res.json(interactions);
  } catch (error) {
    console.error('Interaction fetch error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post(
  '/',
  authenticate,
  body('lead').isMongoId().withMessage('Lead ID required'),
  body('channel').isIn(['email', 'phone', 'sms', 'chat', 'note']).withMessage('Invalid channel'),
  body('body').isLength({ min: 1 }).withMessage('Body required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const interaction = new Interaction({
        ...req.body,
        organization: req.auth.user.organization,
        author: req.auth.user._id
      });
      await interaction.save();
      res.status(201).json(interaction);
    } catch (error) {
      console.error('Interaction create error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
