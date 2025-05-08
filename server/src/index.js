const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Ensure the directory has proper permissions
  fs.chmodSync(uploadsDir, '755');
} catch (error) {
  console.error('Error setting up uploads directory:', error);
}

// Routes
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 