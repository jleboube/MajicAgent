const AgentProfile = require('../models/AgentProfile');
const { modules } = require('../config/modules');

async function ensureAgentProfile(user) {
  if (!user) {
    throw new Error('User required to create agent profile');
  }

  const organizationId = user.organization;
  if (!organizationId) {
    throw new Error('Organization required to create agent profile');
  }

  let profile = await AgentProfile.findOne({ user: user._id });

  const desiredModules = modules
    .filter((module) => ['available', 'beta'].includes(module.status))
    .map((module) => module.slug);

  if (!profile) {
    profile = new AgentProfile({
      user: user._id,
      organization: organizationId,
      brandName: user.company || user.displayName || 'Majic Agent',
      enabledModules: desiredModules,
      preferredModules: []
    });

    await profile.save();
  } else {
    const merged = Array.from(new Set([...(profile.enabledModules || []), ...desiredModules]));
    if (merged.length !== (profile.enabledModules || []).length) {
      profile.enabledModules = merged;
      await profile.save();
    }
  }

  return profile;
}

async function getAgentProfile(userId) {
  return AgentProfile.findOne({ user: userId }).populate('organization', 'name type');
}

async function updateAgentProfile(userId, updates) {
  const profile = await AgentProfile.findOneAndUpdate({ user: userId }, updates, { new: true });
  return profile;
}

module.exports = {
  ensureAgentProfile,
  getAgentProfile,
  updateAgentProfile
};
