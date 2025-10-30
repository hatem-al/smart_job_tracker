const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  // GridFS file id
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  // Stored filename in GridFS
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema); 