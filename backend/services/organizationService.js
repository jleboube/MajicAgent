const Organization = require('../models/Organization');

async function ensureOrganizationForUser(user) {
  if (user.organization) {
    return Organization.findById(user.organization);
  }

  const org = new Organization({
    name: user.company || `${user.displayName || 'Agent'} Organization`,
    type: 'solo',
    owner: user._id,
    members: [{
      user: user._id,
      role: user.role
    }]
  });

  await org.save();

  user.organization = org._id;
  await user.save();

  return org;
}

async function addMemberToOrganization({ organizationId, userId, role }) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw new Error('Organization not found');
  }

  const existingMember = org.members.find(member => member.user.toString() === userId.toString());
  if (existingMember) {
    existingMember.role = role;
  } else {
    org.members.push({ user: userId, role });
  }

  await org.save();
  return org;
}

module.exports = {
  ensureOrganizationForUser,
  addMemberToOrganization
};
