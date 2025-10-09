const mongoose = require('mongoose');

const contactDetailsSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: false },
  preferredChannel: { type: String, enum: ['email', 'sms', 'phone', 'none'], default: 'email' }
}, { _id: false });

const leadSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contact: contactDetailsSchema,
  stage: { 
    type: String, 
    enum: ['new', 'contacted', 'nurturing', 'appointment_scheduled', 'under_contract', 'won', 'lost'], 
    default: 'new' 
  },
  source: { type: String, default: 'manual' },
  tags: [{ type: String }],
  budget: { type: Number, default: null },
  timeframe: { type: String, default: null },
  notes: { type: String, default: '' },
  lastInteractionAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
