const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getUserRoot, generatePresignedUrl } = require('../config/storage');

const router = express.Router();

router.get('/status', authenticate, async (req, res) => {
  try {
    const user = req.auth.user;
    const key = `${getUserRoot(user._id.toString(), user.organization)}/__health.txt`;
    await generatePresignedUrl(key);
    res.json({ ok: true });
  } catch (error) {
    console.warn('Storage status check failed:', error.message);
    res.json({ ok: false, error: error.message });
  }
});

module.exports = router;
