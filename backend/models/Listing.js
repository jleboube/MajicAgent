const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  address: {
    street1: { type: String, required: true },
    street2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'under_contract', 'closed', 'archived'], 
    default: 'draft' 
  },
  listPrice: { type: Number, default: null },
  description: { type: String, default: '' },
  propertyDetails: {
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null },
    squareFeet: { type: Number, default: null },
    lotSize: { type: Number, default: null },
    yearBuilt: { type: Number, default: null }
  },
  media: [{
    artifact: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact', required: true },
    type: { type: String, enum: ['photo', 'document', 'video', 'floorplan'], required: true },
    label: { type: String, default: null }
  }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null }
});

listingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Listing', listingSchema);
