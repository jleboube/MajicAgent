const mongoose = require('mongoose');

const messengerCadenceSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  channel: { type: String, enum: ['email', 'sms', 'voice'], default: 'email' },
  triggerType: {
    type: String,
    enum: ['manual', 'lead_stage', 'listing_status', 'new_lead'],
    default: 'manual'
  },
  triggerValue: { type: String, default: null },
  delayMinutes: { type: Number, default: 0 },
  templateSubject: { type: String, default: '' },
  templateBody: { type: String, required: true },
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  metrics: {
    sent: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    responded: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

messengerCadenceSchema.index({ organization: 1, name: 1 }, { unique: true });

messengerCadenceSchema.pre('save', function registerUpdate(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MessengerCadence', messengerCadenceSchema);
