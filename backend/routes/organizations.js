const express = require('express');
const { body, validationResult } = require('express-validator');
const Organization = require('../models/Organization');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get current organization
router.get('/me', authenticate, async (req, res) => {
  try {
    const organization = await Organization.findById(req.auth.user.organization)
      .populate('members.user', 'email displayName role profilePicture');

    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Organization fetch error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update organization settings
router.put(
  '/:id',
  authenticate,
  requireRole(['team_admin', 'broker_admin']),
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const organizationId = req.params.id;
      if (organizationId !== String(req.auth.user.organization)) {
        return res.status(403).json({ msg: 'Cannot update another organization' });
      }

      const update = {
        ...req.body,
        updatedAt: new Date()
      };

      const organization = await Organization.findByIdAndUpdate(organizationId, update, { new: true });
      res.json(organization);
    } catch (error) {
      console.error('Organization update error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
