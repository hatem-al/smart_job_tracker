const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
const Resume = require('../models/Resume');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get all resumes for the current user
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id });
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ message: 'Failed to fetch resumes' });
  }
});

// Get a specific resume (only if it belongs to the user)
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ message: 'Failed to fetch resume' });
  }
});

// Upload a new resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resume = new Resume({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      user: req.user._id,
      title: req.body.title || req.file.originalname
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ message: 'Failed to upload resume' });
  }
});

// Delete a resume (only if it belongs to the user)
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete the file from the filesystem
    const filePath = path.join(__dirname, '../../uploads', resume.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Resume.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

// Analyze resume against job description (AI-powered)
router.post('/analyze', async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Read the PDF file
    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    // Improved prompt for more actionable and concise output
    const prompt = `You are a professional resume reviewer. Given the following resume text and job description, do the following:
1. List the top 5 most relevant keywords from the resume that match the job description.
2. List the top 5 most important keywords missing from the resume that are present in the job description.
3. Provide 3-5 specific, actionable suggestions to improve the resume for this job.
4. Write a 2-3 sentence summary of the resume's strengths and weaknesses for this job.\n\nReturn your answer as a JSON object with keys: matchingKeywords, missingKeywords, suggestions, summary.\n\nResume Text:\n"""${resumeText}"""\n\nJob Description:\n"""${jobDescription}"""`;

    // Use OpenAI API
    let aiResponse;
    try {
      aiResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for resume analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });
    } catch (err) {
      // fallback to gpt-3.5-turbo if quota error
      aiResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for resume analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });
    }

    // Parse the AI response
    let analysis;
    try {
      analysis = JSON.parse(aiResponse.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ message: 'Failed to parse AI response', raw: aiResponse.choices[0].message.content });
    }

    res.json({
      ...analysis,
      resumeText: resumeText.slice(0, 2000) // Optionally limit resume text length
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ message: 'Failed to analyze resume', error: error.message });
  }
});

module.exports = router;