const mongoose = require('mongoose');

const agentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  brandName: { type: String, default: 'Majic Agent' },
  tagline: { type: String, default: 'One stop platform for modern real estate pros.' },
  avatarUrl: { type: String, default: null },
  websiteUrl: { type: String, default: null },
  preferredModules: [{ type: String }],
  enabledModules: [{ type: String }],
  onboardingStage: { type: String, enum: ['welcome', 'import_leads', 'connect_modules', 'active'], default: 'welcome' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

agentProfileSchema.pre('save', function registerUpdate(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('AgentProfile', agentProfileSchema);
