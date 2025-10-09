const Listing = require('../models/Listing');
const Task = require('../models/Task');
const { callOpenAICompletion } = require('./aiContent');

async function runBuyerIntakePrompt(messages = []) {
  const prompt = `You are an AI assistant with the task of gathering essential details from a customer interested in purchasing a new property.
Begin by briefly explaining that the goal is to understand the customer's preferences to recommend properties.
Ask the following one at a time:
- Preferred location
- Number of rooms needed
- Preferred house size
- Desired amenities
- Budget
Summarize, thank them, and include '<EOC>' at the end.

Conversation:
${messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

AI:`;

  return callOpenAICompletion(prompt);
}

async function runListingFlowPrompt(user, listingId) {
  if (!listingId) {
    return { summary: 'No listing selected.<EOC>' };
  }

  const listing = await Listing.findOne({ _id: listingId, organization: user.organization });
  if (!listing) {
    return { summary: 'Listing not found.<EOC>' };
  }

  const tasks = await Task.find({ relatedListing: listing._id, organization: user.organization }).sort({ dueDate: 1 });

  const prompt = `You are assisting agent ${user.displayName || user.email} with listing ${listing.address.street1}.
Market tasks executed:
${tasks.map((task) => `${task.title} - status: ${task.status}`).join('\n') || 'No tasks yet.'}
Suggest the next 3 concrete actions the agent should take to progress the listing, referencing the persona checklist.
Conclude your guidance with '<EOC>'.`;

  return callOpenAICompletion(prompt);
}

module.exports = {
  runBuyerIntakePrompt,
  runListingFlowPrompt
};
