const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const Resume = require('../models/Resume');

// Initialize OpenAI with error checking
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get all resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ uploadDate: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a new resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resume = new Resume({
      title: req.body.title,
      filename: req.file.filename,
      path: req.file.path,
      uploadDate: new Date()
    });

    const savedResume = await resume.save();
    res.status(201).json(savedResume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.download(resume.path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a resume
router.delete('/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete the file from the filesystem
    fs.unlinkSync(resume.path);

    // Delete the database record
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Analyze resume with AI
router.post('/analyze', async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: 'Resume ID and job description are required' });
    }

    // Get the resume file
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Read and parse the PDF
    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    // Log API key status (first few characters only for security)
    const apiKeyPrefix = process.env.OPENAI_API_KEY ? 
      `${process.env.OPENAI_API_KEY.substring(0, 4)}...` : 
      'not set';
    console.log('Using OpenAI API key:', apiKeyPrefix);

    // Use OpenAI to analyze the resume
    const prompt = `You are a professional resume analyzer. Analyze the following resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide a detailed analysis in the following JSON format:
{
  "matchingKeywords": ["keyword1", "keyword2", ...],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "resumeText": "${resumeText}"
}

Guidelines:
1. For matchingKeywords: List all relevant skills, technologies, and qualifications that appear in both the resume and job description
2. For missingKeywords: List important skills and requirements from the job description that are not found in the resume
3. For suggestions: Provide specific, actionable recommendations to improve the resume
4. Keep all arrays concise and focused on the most important items
5. Ensure the response is valid JSON`;

    try {
      // First try with gpt-3.5-turbo-16k
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-16k",
          messages: [
            {
              role: "system",
              content: "You are a professional resume analyzer. Your task is to analyze resumes against job descriptions and provide structured feedback in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
      } catch (modelError) {
        // If that fails, try with gpt-3.5-turbo
        console.log('Falling back to gpt-3.5-turbo model');
        completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a professional resume analyzer. Your task is to analyze resumes against job descriptions and provide structured feedback in JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
      }

      // Parse the AI response
      const analysis = JSON.parse(completion.choices[0].message.content);
      res.json(analysis);
    } catch (openaiError) {
      console.error('OpenAI API Error:', {
        status: openaiError.status,
        message: openaiError.message,
        code: openaiError.code,
        type: openaiError.type,
        response: openaiError.response?.data
      });

      // Provide more helpful error message
      if (openaiError.status === 429) {
        throw new Error('OpenAI API quota exceeded. Please check your billing information at https://platform.openai.com/account/billing');
      }
      throw openaiError;
    }
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      message: 'Error analyzing resume: ' + error.message,
      details: error.response?.data || error
    });
  }
});

module.exports = router; 