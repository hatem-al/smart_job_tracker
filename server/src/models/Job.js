const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Saved'],
    default: 'Applied'
  },
  date: {
    type: Date,
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  notes: {
    type: String
  },
  description: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  statusChangedAt: {
    type: Date
  }
});

// Pre-save hook to update statusChangedAt when status changes
jobSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusChangedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema); 