const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Saved'],
    default: 'Applied'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  resumeUsed: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  jobDescription: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema); 