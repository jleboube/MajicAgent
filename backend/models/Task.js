const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['listing', 'lead', 'transaction', 'admin'], default: 'lead' },
  relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
  relatedListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'blocked'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  checklist: [{
    label: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
