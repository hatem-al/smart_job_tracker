const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema); 