const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Get all jobs for the current user
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id })
      .populate('resume', 'title filename')
      .sort({ date: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get a specific job (only if it belongs to the user)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id })
      .populate('resume', 'title filename');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    if (req.body.resume === '') {
      req.body.resume = undefined;
    }
    const job = new Job({
      ...req.body,
      user: req.user._id
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Update a job (only if it belongs to the user)
router.put('/:id', async (req, res) => {
  try {
    if (req.body.resume === '') {
      req.body.resume = undefined;
    }
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // If status is changing, update statusChangedAt
    if (req.body.status && req.body.status !== job.status) {
      job.statusChangedAt = new Date();
    }
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// Update a job (only if it belongs to the user) - PATCH
router.patch('/:id', async (req, res) => {
  try {
    if (req.body.resume === '') {
      req.body.resume = undefined;
    }
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    // If status is changing, update statusChangedAt
    if (req.body.status && req.body.status !== job.status) {
      job.statusChangedAt = new Date();
    }
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
});

// Delete a job (only if it belongs to the user)
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Job.deleteOne({ _id: req.params.id });
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

module.exports = router; 