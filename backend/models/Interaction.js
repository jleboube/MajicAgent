const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['email', 'phone', 'sms', 'chat', 'note'], default: 'note' },
  subject: { type: String, default: '' },
  body: { type: String, required: true },
  occurredAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

interactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Interaction', interactionSchema);
