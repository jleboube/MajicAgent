const express = require('express');
const { body, validationResult } = require('express-validator');
const Listing = require('../models/Listing');
const { authenticate } = require('../middleware/auth');
const { generateListingCopy } = require('../services/aiContent');
const { activateListingFlow } = require('../services/agentFlowService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const listings = await Listing.find({ organization: req.auth.user.organization })
      .populate('lead', 'contact')
      .sort({ updatedAt: -1 });
    res.json(listings);
  } catch (error) {
    console.error('Listing fetch error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post(
  '/',
  authenticate,
  body('address.street1').isLength({ min: 3 }).withMessage('Street address required'),
  body('address.city').isLength({ min: 2 }).withMessage('City required'),
  body('address.state').isLength({ min: 2 }).withMessage('State required'),
  body('address.postalCode').isLength({ min: 3 }).withMessage('Postal code required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const listing = new Listing({
        ...req.body,
        organization: req.auth.user.organization,
        owner: req.auth.user._id
      });
      await listing.save();

      try {
        await activateListingFlow(req.auth.user, listing);
      } catch (flowError) {
        console.warn('Listing flow activation warning:', flowError.message);
      }

      res.status(201).json(listing);
    } catch (error) {
      console.error('Listing create error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

router.put('/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, organization: req.auth.user.organization },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Listing update error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/:id/generate-copy', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, organization: req.auth.user.organization }).populate('lead');
    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }

    const copy = await generateListingCopy({ listing, agentName: req.auth.user.displayName || req.auth.user.email });
    res.json(copy);
  } catch (error) {
    console.error('Listing copy generation error:', error.message);
    res.status(500).json({ msg: 'AI generation failed', error: error.message });
  }
});

module.exports = router;
