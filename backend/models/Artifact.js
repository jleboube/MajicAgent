const mongoose = require('mongoose');

const artifactSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  category: { type: String, enum: ['listing', 'transaction', 'marketing', 'compliance', 'other'], default: 'listing' },
  tags: [{ type: String }],
  visibility: { type: String, enum: ['private', 'organization', 'public'], default: 'private' },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  relatedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
  checksum: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

artifactSchema.index({ organization: 1, key: 1 }, { unique: true });
artifactSchema.index({ createdAt: -1 });
artifactSchema.index({ tags: 1 });

artifactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Artifact', artifactSchema);
