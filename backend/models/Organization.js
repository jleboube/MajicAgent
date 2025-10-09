const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['solo', 'team', 'brokerage'], 
    default: 'solo' 
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['solo_agent', 'team_admin', 'broker_admin'], required: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  settings: {
    defaultLeadSource: { type: String, default: 'manual' },
    notificationEmails: [{ type: String }],
    branding: {
      logoUrl: { type: String, default: null },
      brandColor: { type: String, default: '#2563eb' }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

organizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);
