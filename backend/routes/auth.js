const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createUserFolder } = require('../config/storage');
const { ensureOrganizationForUser } = require('../services/organizationService');
const { ensureAgentProfile } = require('../services/agentProfileService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.auth.user;
    const agentProfile = req.auth.agentProfile;
    const remainingCredits = user.photoCredits - user.photosEnhanced;

    res.json({
      id: user._id,
      email: user.email,
      company: user.company,
      role: user.role,
      organization: user.organization,
      photoCredits: user.photoCredits,
      photosEnhanced: user.photosEnhanced,
      remainingCredits: remainingCredits,
      isUnlimited: user.isUnlimited,
      hasRegistrationCode: !!user.registrationCode,
      onboardingCompleted: user.onboardingCompleted,
      profilePicture: user.profilePicture,
      displayName: user.displayName,
      agentProfile
    });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, company, registrationCode } = req.body;
  try {
    // Validate input
    if (!email || !password || !company) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Validate registration code format if provided
    let isUnlimited = false;
    if (registrationCode) {
      // Check if it's a 32-character hexadecimal string
      const hexPattern = /^[0-9a-fA-F]{32}$/;
      if (!hexPattern.test(registrationCode)) {
        return res.status(400).json({ msg: 'Invalid registration code format. Must be 32-character hexadecimal string.' });
      }
      
      // TODO: In production, you'd validate against a database of valid codes
      // For now, any valid 32-char hex code grants unlimited access
      isUnlimited = true;
      console.log(`Registration with code: ${registrationCode} - granting unlimited access`);
    }

    // Check for existing user
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user with storageFolder set to a temporary unique ID
    user = new User({ 
      email, 
      password, 
      company, 
      storageFolder: null,
      registrationCode: registrationCode || null,
      photoCredits: isUnlimited ? 999999 : 10,  // High number for unlimited
      isUnlimited: isUnlimited,
      role: 'solo_agent'
    });
    await user.save();
    console.log(`User created: ${email}`);

    // Ensure organization and storage folder
    const organization = await ensureOrganizationForUser(user);
    const storageFolder = user._id.toString();
    user.storageFolder = storageFolder;
    user.organization = organization._id;
    await user.save();
    console.log(`Storage folder assigned: ${user.storageFolder}`);

    if (!user.storageFolder) {
      user.storageFolder = user._id.toString();
      await user.save();
    }

    await createUserFolder(user._id.toString(), user.organization);
    console.log(`Object storage folders ready for user: ${user.storageFolder}`);

    await ensureAgentProfile(user);
    console.log(`Agent profile ensured for user: ${user._id}`);

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email, 
        company, 
        role: user.role,
        organization: user.organization 
      } 
    });
  } catch (err) {
    console.error('Registration error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!user.organization) {
      await ensureOrganizationForUser(user);
    }

    await ensureAgentProfile(user);

    if (!user.storageFolder) {
      user.storageFolder = user._id.toString();
      await user.save();
    }

    await createUserFolder(user._id.toString(), user.organization);

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        email, 
        company: user.company,
        role: user.role,
        organization: user.organization 
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
