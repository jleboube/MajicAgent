const Task = require('../models/Task');
const MessengerCadence = require('../models/MessengerCadence');
const { triggerWorkflow } = require('./n8nService');

function normalizeId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.toHexString) return value.toHexString();
    if (value._id) return normalizeId(value._id);
  }
  return String(value);
}

function getOrganizationId(user) {
  return normalizeId(user.organization);
}

function defaultAssignee(user) {
  return user._id;
}

async function upsertTask(filter, insertValues) {
  await Task.updateOne(
    filter,
    {
      $setOnInsert: insertValues
    },
    { upsert: true }
  );
}

async function ensureCadence({
  organization,
  owner,
  name,
  description,
  channel,
  triggerType,
  triggerValue,
  delayMinutes,
  templateSubject,
  templateBody
}) {
  await MessengerCadence.findOneAndUpdate(
    { organization, name },
    {
      $setOnInsert: {
        organization,
        owner,
        description,
        channel,
        triggerType,
        triggerValue,
        delayMinutes,
        templateSubject,
        templateBody,
        status: 'active'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function activateLeadFlow(user, lead) {
  const organization = getOrganizationId(user);
  if (!organization) return;

  const assignee = defaultAssignee(user);
  const leadId = normalizeId(lead._id);
  const now = new Date();

  await upsertTask(
    { organization, relatedLead: leadId, title: 'Call new lead' },
    {
      organization,
      createdBy: user._id,
      assignee,
      title: 'Call new lead',
      description: 'Call within 15 minutes to qualify the opportunity.',
      category: 'lead',
      relatedLead: leadId,
      priority: 'high',
      dueDate: now
    }
  );

  await upsertTask(
    { organization, relatedLead: leadId, title: 'Send introduction email' },
    {
      organization,
      createdBy: user._id,
      assignee,
      title: 'Send introduction email',
      description: 'Send intro email with value proposition and next steps.',
      category: 'lead',
      relatedLead: leadId,
      priority: 'medium',
      dueDate: new Date(now.getTime() + 60 * 60 * 1000)
    }
  );

  await ensureCadence({
    organization,
    owner: user._id,
    name: 'Auto - New Lead Drip',
    description: 'Automatic multi-touch follow up sequence for new leads.',
    channel: 'email',
    triggerType: 'new_lead',
    triggerValue: 'new',
    delayMinutes: 30,
    templateSubject: 'Great connecting with you about your real estate goals',
    templateBody:
      'Hi {{lead.firstName || "there"}},\n\nThanks for reaching out! Could we schedule a quick call to discuss your plans?\n\nBest,\n{{agent.displayName || agent.email}}'
  });

  await triggerWorkflow('lead_created', {
    lead,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName
    }
  });
}

async function activateListingFlow(user, listing) {
  const organization = getOrganizationId(user);
  if (!organization) return;

  const assignee = defaultAssignee(user);
  const listingId = normalizeId(listing._id);
  const now = new Date();

  await upsertTask(
    { organization, relatedListing: listingId, title: 'Gather marketing assets' },
    {
      organization,
      createdBy: user._id,
      assignee,
      title: 'Gather marketing assets',
      description: 'Collect property photos, disclosures, and branding assets.',
      category: 'listing',
      relatedListing: listingId,
      priority: 'medium',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    }
  );

  await upsertTask(
    { organization, relatedListing: listingId, title: 'Launch listing announcement' },
    {
      organization,
      createdBy: user._id,
      assignee,
      title: 'Launch listing announcement',
      description: 'Publish to MLS, Majic Photo, website, and social channels.',
      category: 'listing',
      relatedListing: listingId,
      priority: 'high',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    }
  );

  await ensureCadence({
    organization,
    owner: user._id,
    name: 'Auto - Listing Updates',
    description: 'Weekly updates to seller about marketing activity and interest.',
    channel: 'email',
    triggerType: 'listing_status',
    triggerValue: 'active',
    delayMinutes: 60 * 24 * 7, // weekly
    templateSubject: 'Weekly update for {{listing.address.street1}}',
    templateBody:
      'Hi {{seller.firstName || "there"}},\n\nHere is your weekly progress update for {{listing.address.street1}}.\n- Inquiries: {{listing.metrics.inquiries || "0"}}\n- Showings: {{listing.metrics.showings || "0"}}\n\nWe will keep optimizing the marketing plan and let you know of any offers.\n\nBest,\n{{agent.displayName || agent.email}}'
  });

  await triggerWorkflow('listing_created', {
    listing,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName
    }
  });
}

module.exports = {
  activateLeadFlow,
  activateListingFlow
};
