const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AgentProfile = require('../models/AgentProfile');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
      return res.status(401).json({ msg: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('organization');

    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    const agentProfile = await AgentProfile.findOne({ user: user._id }) || null;

    req.auth = {
      tokenId: decoded.id,
      user,
      agentProfile
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
}

function requireRole(roles = []) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.auth?.user) {
      return res.status(401).json({ msg: 'Authentication required' });
    }

    if (allowedRoles.length === 0 || allowedRoles.includes(req.auth.user.role)) {
      return next();
    }

    return res.status(403).json({ msg: 'Insufficient permissions' });
  };
}

module.exports = {
  authenticate,
  requireRole
};
