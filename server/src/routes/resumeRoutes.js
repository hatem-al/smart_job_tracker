const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const OpenAI = require('openai');
const Resume = require('../models/Resume');
const mongoose = require('mongoose');
const { Readable } = require('stream');

// Configure multer to keep file in memory – we'll store to GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file && typeof file.mimetype === 'string' && file.mimetype.toLowerCase().includes('pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper: GridFS bucket
function getBucket() {
  if (!mongoose.connection.db) {
    throw new Error('Database not initialized');
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple in-memory rate limiter: 10 /analyze requests per 15 min per user
const analyzeRequests = new Map();
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [key, timestamps] of analyzeRequests) {
    const fresh = timestamps.filter(t => t > cutoff);
    if (fresh.length === 0) analyzeRequests.delete(key);
    else analyzeRequests.set(key, fresh);
  }
}, 5 * 60 * 1000);

function analyzeRateLimit(req, res, next) {
  const key = req.user._id.toString();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 10;
  const timestamps = (analyzeRequests.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= max) {
    return res.status(429).json({ message: 'Too many requests. Please wait before analyzing again.' });
  }
  timestamps.push(now);
  analyzeRequests.set(key, timestamps);
  next();
}

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

// Stream the resume PDF file (only if it belongs to the user)
router.get('/:id/file', async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resume.originalName || resume.filename)}"`);

    if (resume.fileId) {
      // New GridFS-based storage
      const bucket = getBucket();
      const stream = bucket.openDownloadStream(resume.fileId);
      stream.on('error', (err) => {
        console.error('Error streaming from GridFS:', err);
        res.status(500).end();
      });
      stream.pipe(res);
    } else {
      // Backward compatibility: legacy filesystem storage
      const filePath = resume.path || path.join(__dirname, '../../uploads', resume.filename);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Resume file not found' });
      }
      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Error streaming from filesystem:', err);
        res.status(500).end();
      });
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error streaming resume file:', error);
    res.status(500).json({ message: 'Failed to stream resume file' });
  }
});

// Upload a new resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: 'application/pdf'
    });

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    const resume = new Resume({
      fileId: uploadStream.id,
      filename: uploadStream.filename,
      originalName: req.file.originalname,
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

    if (resume.fileId) {
      // GridFS delete
      const bucket = getBucket();
      try {
        await bucket.delete(resume.fileId);
      } catch (e) {
        console.error('Error deleting GridFS file:', e);
      }
    } else {
      // Legacy filesystem delete
      const filePath = resume.path || path.join(__dirname, '../../uploads', resume.filename);
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Error deleting legacy file:', e);
        }
      }
    }

    await Resume.deleteOne({ _id: req.params.id });
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

// Split a JD into weighted sections so the model can apply accurate scoring.
// Returns a formatted string with explicit weight labels per section.
function parseJDSections(jd) {
  const SECTIONS = [
    {
      key: 'basic',
      label: 'BASIC QUALIFICATIONS (weight 3×)',
      patterns: [
        'basic qualifications', 'required qualifications', 'minimum qualifications',
        'minimum requirements', 'basic requirements', 'you must have', 'requirements',
      ],
    },
    {
      key: 'preferred',
      label: 'PREFERRED QUALIFICATIONS (weight 2×)',
      patterns: [
        'preferred qualifications', 'preferred skills', 'nice to have', 'nice-to-have',
        'bonus qualifications', 'plus if you have', 'preferred experience',
      ],
    },
    {
      key: 'responsibilities',
      label: 'KEY RESPONSIBILITIES (weight 2×)',
      patterns: [
        'key job responsibilities', 'key responsibilities', 'responsibilities',
        'what you will do', "what you'll do", 'a day in the life',
        'in this role', 'about the role', 'the role', 'your role', 'role overview',
      ],
    },
  ];

  const lines = jd.split('\n');
  const buckets = { basic: [], preferred: [], responsibilities: [], general: [] };
  let currentKey = 'general';

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/[*_#\-:]/g, ' ').trim().replace(/\s+/g, ' ');
    const matched = SECTIONS.find(s =>
      s.patterns.some(p => normalized === p || normalized.startsWith(p + ' ') || normalized.startsWith(p + ':'))
    );
    if (matched) {
      currentKey = matched.key;
    } else {
      buckets[currentKey].push(line);
    }
  }

  const parts = [];
  for (const { key, label } of SECTIONS) {
    const content = buckets[key].join('\n').trim();
    if (content) parts.push(`[${label}]\n${content}`);
  }
  const general = buckets.general.join('\n').trim();
  if (general) parts.push(`[GENERAL DESCRIPTION (weight 1×)]\n${general}`);

  // Fall back to raw JD if no sections were detected
  return parts.length > 1 ? parts.join('\n\n') : `[GENERAL DESCRIPTION (weight 1×)]\n${jd}`;
}

// ============================================================================
// AI ANALYSIS PIPELINE
//
// Two passes, with deterministic scoring in code between them:
//
//   1. extractKeywordsAndCompany(taggedJD)
//        – Model returns short ATS phrases + the hiring company.
//   2. annotateAndScore(keywords, jd)
//        – Code counts JD frequencies and computes weighted_score + priority.
//   3. analyzeAgainstResume(resumeText, taggedJD, scoredKeywords, company)
//        – Model assigns status, writes bridges, bullets, summary, quick wins.
//   4. sanitizeAnalysis(merged)
//        – Drops outputs that violate hard rules (LP openers, near-duplicate
//          bullet rewrites). Trust-but-verify against the model.
// ============================================================================

const SECTION_WEIGHTS = { basic: 3, preferred: 2, responsibilities: 2, general: 1 };
const VALID_SECTIONS = new Set(['basic', 'preferred', 'responsibilities', 'general']);

const LP_OPENER_RE = /^\s*(dove deep|delivered results|earned trust|bias for action|thought big|think big|owned end[- ]to[- ]end)\b/i;
const BANNED_SUMMARY_RE = /\b(looking to|eager|passionate|innovative|fast[- ]paced|dynamic|drive impactful|leverage my|successfully|seeking to|excited to|results[- ]driven|team player|responsible for|detail[- ]oriented|hard worker|enhance user experience|operational efficiency)\b/i;

function startsWithLP(s) {
  return LP_OPENER_RE.test(s || '');
}

function isValidKeyword(term) {
  if (!term || typeof term !== 'string') return false;
  const t = term.trim();
  if (t.length < 2 || t.length > 60) return false;
  const words = t.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6;
}

function tokenSet(s) {
  return new Set((s || '').toLowerCase().match(/\b[a-z][a-z0-9+]{2,}\b/g) || []);
}

function jaccard(a, b) {
  const A = tokenSet(a), B = tokenSet(b);
  if (!A.size && !B.size) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / new Set([...A, ...B]).size;
}

async function extractKeywordsAndCompany(taggedJD) {
  const sys = `You read a job description and extract two things.

1. detected_company — The hiring company name, or null if it cannot be confidently determined.

2. keywords — 15 to 25 short ATS-style phrases.

KEYWORD RULES (strict):
- Each "term" is 1 to 4 words. NEVER a full sentence.
- Capture: tools, frameworks, languages, platforms, named methodologies, technical concepts ("distributed systems", "CI/CD", "event-driven architecture"), and explicit named soft skills ("cross-functional collaboration").
- SKIP: filler ("experience", "knowledge", "ability", "passion", "strong"), year requirements ("3+ years"), degree statements, generic verbs.
- The "section" field labels where the term FIRST appears, using the bracketed section labels in the input:
    "basic"            — under BASIC QUALIFICATIONS
    "preferred"        — under PREFERRED QUALIFICATIONS
    "responsibilities" — under KEY RESPONSIBILITIES
    "general"          — anywhere else
- Terms must appear verbatim or as a near-exact substring. Do not paraphrase.

OR LIST RULE — CRITICAL:
When the JD contains an interchangeable OR list joined by "or" (e.g. "Java, Python, C++, or Go"),
extract each term individually AND tag each with "or_group": true.
Also emit a top-level "or_groups" array — one sub-array per OR list, containing the exact terms.
Non-OR keywords get "or_group": false and are NOT listed in "or_groups".

Example — JD says "Proficiency in Java, Python, C++, or Go":
keywords include: { "term": "Java", "section": "basic", "or_group": true }, { "term": "Python", ... true }, ...
or_groups includes: ["Java", "Python", "C++", "Go"]

Return JSON only:
{ "detected_company": string | null,
  "keywords": [{ "term": string, "section": "basic"|"preferred"|"responsibilities"|"general", "or_group": boolean }],
  "or_groups": string[][] }`;

  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: taggedJD },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(r.choices[0].message.content);
}

function annotateAndScore(keywords, jd) {
  const jdLower = jd.toLowerCase();
  const seen = new Set();

  const cleaned = (keywords || [])
    .filter(k => isValidKeyword(k && k.term))
    .map(k => ({
      term: k.term.trim(),
      section: VALID_SECTIONS.has(k.section) ? k.section : 'general',
      or_group: !!k.or_group,
    }))
    .filter(k => {
      const key = k.term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return cleaned
    .map(k => {
      const escaped = k.term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?:^|[^a-z0-9_])${escaped}(?:[^a-z0-9_]|$)`, 'gi');
      let count = 0, m;
      while ((m = re.exec(jdLower)) !== null) {
        count++;
        if (m.index === re.lastIndex) re.lastIndex++;
      }
      const frequency = Math.max(count, 1);
      const rawScore = frequency * (SECTION_WEIGHTS[k.section] || 1);
      let priority;
      if (k.section === 'basic') priority = 'high';
      else if (rawScore >= 6) priority = 'high';
      else if (rawScore >= 3) priority = 'medium';
      else priority = 'low';
      return { ...k, frequency, weighted_score: rawScore, priority };
    })
    .sort((a, b) => b.weighted_score - a.weighted_score);
}

async function analyzeAgainstResume(resumeText, taggedJD, scoredKeywords, company) {
  const isAmazon = company === 'Amazon';

  const companyLine = isAmazon
    ? 'COMPANY: Amazon. Frame ALL analysis around Leadership Principles — see LP rules below.'
    : company
      ? `COMPANY: ${company}. Mirror their hiring culture and the JD's exact vocabulary.`
      : 'COMPANY: unknown. Apply general SWE best practices.';

  const amazonRules = isAmazon ? `

═══════════════════════════════════════
AMAZON LP PLACEMENT (violations stripped)
═══════════════════════════════════════
Use ONLY these mappings — no others:
  "Dove deep"         → debugging, investigation, root cause analysis only
  "Delivered results" → any bullet that has a metric or outcome
  "Earned trust"      → security, reliability, cross-team work
  "Bias for action"   → shipped fast, unblocked, made a decisive call
  "Owned end-to-end"  → full lifecycle from design through deployment
  "Think big"         → ONLY architecture or product-scope decisions; NEVER individual features

HARD RULES:
- NEVER open a sentence with LP language
  BAD:  "Dove deep to reduce error rates..."
  GOOD: "...reduced error rates by 30% by diving deep into root cause analysis..."
- NEVER force LP — if it doesn't fit naturally, omit it entirely
- A clean metric bullet always beats a forced LP bullet` : '';

  const sys = `You are an expert technical recruiter and ATS specialist. Keywords have been pre-extracted and scored by upstream code. DO NOT re-score. Your job: judgment, not arithmetic.

${companyLine}${amazonRules}

═══════════════════════════════════════
ALL FIVE OUTPUTS ARE REQUIRED
═══════════════════════════════════════

1. KEYWORD STATUS
   Classify each provided keyword:
   - "present" : exact, near-exact, or semantically equivalent in resume
   - "partial"  : adjacent skill present but not quite the same concept
   - "missing"  : no evidence at all
   - "evidence" : exact resume line for "present"/"partial" (null if missing)
   - "gap"      : for "partial" only — one phrase naming what's missing to fully satisfy this keyword (null otherwise)

   SEMANTIC MATCHING — use equivalence, not exact strings:
     "scalable REST APIs"          → "scalable services"
     "MongoDB + PostgreSQL"        → "SQL and NoSQL database systems"
     "Azure DevOps + Docker"       → "CI/CD principles"
     "Linux debugging + logging"   → "monitoring" + "troubleshooting"
     "Git + GitHub"                → "version control systems"
     "JWT auth + role permissions" → "security best practices"
     "Agile/Scrum"                 → "agile environment"

   OR LIST RULE — CRITICAL:
   Keywords tagged "or_group: true" in the table are interchangeable JD alternatives.
   → If resume has ANY member of the group, mark ALL group members as "present"
   → NEVER surface individual OR-list terms as "missing" if any sibling is present
   → NEVER suggest learning a new language to satisfy an OR requirement already met

2. SUGGESTIONS
   For every "missing" or "partial" keyword:
   - MUST reference specific existing resume content by name
   - Must be actionable in under 10 minutes where possible
   - For LOW priority with no adjacent resume evidence: set suppress=true, suggestion="Low priority for this role"
   - NEVER say "consider a focused side project or targeted course"
   - NEVER suggest learning a new language for an OR requirement already satisfied

   BAD:  "Consider taking an AWS course"
   GOOD: "Your Azure infrastructure experience maps directly — reframe the CI/CD bullet to mention cross-region deployment or fault-tolerant architecture explicitly"

3. BULLET REWRITES — exactly 3:
   VERB RULES (hard):
   - NEVER downgrade a strong verb: "Engineered"→never "Developed/Built"; "Architected"→never "Designed/Created"
   - Lead with the strongest available verb, or lead with the metric
   - NEVER start with "I"

   CONTENT RULES (hard):
   - Preserve ALL specific technology names exactly — they are ATS signals
   - Preserve ALL metrics exactly as stated in the original
   - NEVER fabricate experience or invent metrics
   - NEVER make the rewrite longer than the original
   - Cut filler: "successfully", "effectively", "various", "multiple"
   - Rewrite must be meaningfully different — not just rephrased

   RATIONALE: name the specific structural change made, not just "emphasizes impact"

4. SUMMARY — exactly 3 sentences (hard):
   - Sentence 1: concrete technical identity (role + primary stack + scale). Never open with "I" or LP.
   - Sentence 2: MUST reference a specific metric from the resume if one exists (real number, no placeholder). If the resume contains no quantified metrics, describe the most concrete, specific achievement instead — no vague claims like "improved performance" or "enhanced efficiency".
   - Sentence 3: forward-looking technical interest, specific to this role's mission

   BANNED (instant fail — output rejected if any appear):
   looking to, eager, passionate, innovative, fast-paced, dynamic, drive impactful,
   leverage my, successfully, seeking to, excited to, responsible for, results-driven,
   detail-oriented, team player, hard worker, enhance user experience, operational efficiency,
   [company name]

   GOOD EXAMPLE:
   "Backend engineer with production experience in Python, REST APIs, and cloud infrastructure
   managing 10,000+ document pipelines. Reduced data retrieval latency by 40% and cut production
   error rates by 30% through MongoDB optimization and systematic Linux debugging. Currently
   building AI-powered developer tooling with RAG pipelines and LLM integration."

5. QUICK WINS — this field MUST contain EXACTLY 5 objects. Never return fewer.
   There is always something to improve: skills section ordering, section headings,
   education line, project descriptions, contact line, dates, phrasing tweaks,
   missing keywords in the skills list, weak verb choices in untouched bullets.
   - Each must show exact before + exact after text from THIS resume
   - Must be specific to THIS resume and THIS JD — no generic advice
   - Each fix must take under 10 minutes
   - "after" text may NOT open with LP language
   - NEVER suggest adding "operational excellence" as a skill keyword

OUTPUT — return ONLY this JSON, no surrounding text:
{
  "keyword_status": [{ "term": string, "status": "present"|"partial"|"missing", "evidence": string|null, "gap": string|null }],
  "suggestions":    [{ "term": string, "suggestion": string, "suppress": boolean }],
  "bullet_rewrites":[{ "before": string, "after": string, "rationale": string }],
  "summary_rewrite": string,
  "quick_wins":     [{ "location": string, "before": string, "after": string }]
}`;

  const keywordTable = scoredKeywords
    .map(k => `- ${k.term}  ·  section=${k.section}  ·  freq=${k.frequency}  ·  score=${k.weighted_score}  ·  priority=${k.priority}`)
    .join('\n');

  const user = `Resume:
"""
${resumeText}
"""

Job description (pre-parsed into weighted sections):
"""
${taggedJD}
"""

Pre-extracted keywords (already scored — DO NOT recompute):
${keywordTable}`;

  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    temperature: 0.45,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(r.choices[0].message.content);
}

function mergeAnalysis(scoredKeywords, secondPass, company, orGroups) {
  const validStatus = new Set(['present', 'partial', 'missing']);
  const statusMap = new Map();
  const evidenceMap = new Map();
  const gapMap = new Map();
  for (const s of secondPass.keyword_status || []) {
    if (s?.term) {
      const key = s.term.toLowerCase();
      statusMap.set(key, validStatus.has(s.status) ? s.status : 'missing');
      evidenceMap.set(key, typeof s.evidence === 'string' ? s.evidence : null);
      if (s.status === 'partial' && s.gap) gapMap.set(key, s.gap);
    }
  }
  const suggestionMap = new Map();
  const suppressMap = new Map();
  for (const s of secondPass.suggestions || []) {
    if (s?.term) {
      const key = s.term.toLowerCase();
      suggestionMap.set(key, s.suggestion);
      suppressMap.set(key, !!s.suppress);
    }
  }

  // OR-group propagation: for each explicit group from pass 1, if ANY member is present,
  // mark the rest as present too. Groups are distinct lists so we never conflate separate
  // OR sets (Java/Python/Go ≠ Kafka/Kinesis/SQS).
  for (const group of (orGroups || [])) {
    const lowerGroup = group.map(t => (t || '').toLowerCase()).filter(Boolean);
    const anyPresent = lowerGroup.some(t => statusMap.get(t) === 'present');
    if (anyPresent) {
      const sharedEvidence = lowerGroup.map(t => evidenceMap.get(t)).find(e => e) || null;
      for (const t of lowerGroup) {
        if (statusMap.get(t) !== 'present') {
          statusMap.set(t, 'present');
          if (!evidenceMap.get(t)) evidenceMap.set(t, sharedEvidence);
        }
      }
    }
  }

  const keyword_analysis = { present: [], partial: [], missing: [] };
  for (const k of scoredKeywords) {
    const key = k.term.toLowerCase();
    const status = statusMap.get(key) || 'missing';
    if (status === 'present') {
      keyword_analysis.present.push({ keyword: k.term, evidence: evidenceMap.get(key) || null });
    } else if (status === 'partial') {
      keyword_analysis.partial.push({ keyword: k.term, evidence: evidenceMap.get(key) || null, gap: gapMap.get(key) || null });
    } else {
      keyword_analysis.missing.push({ keyword: k.term });
    }
  }

  const priority_gaps = scoredKeywords
    .filter(k => (statusMap.get(k.term.toLowerCase()) || 'missing') !== 'present')
    .slice(0, 10)
    .map(k => ({
      keyword: k.term,
      score: k.weighted_score,
      priority: k.priority,
      suggestion: suggestionMap.get(k.term.toLowerCase()) || 'No adjacent experience identified.',
      suppress: suppressMap.get(k.term.toLowerCase()) || false,
    }));

  return {
    detected_company: company || null,
    amazon_detected: company === 'Amazon',
    keyword_analysis,
    priority_gaps,
    bullet_rewrites: Array.isArray(secondPass.bullet_rewrites) ? secondPass.bullet_rewrites : [],
    summary_rewrite: typeof secondPass.summary_rewrite === 'string' ? secondPass.summary_rewrite : '',
    quick_wins: Array.isArray(secondPass.quick_wins) ? secondPass.quick_wins : [],
  };
}

async function regenerateSummary(resumeText, scoredKeywords, company) {
  const sys = `Write exactly one 3-sentence professional summary for the resume below.

HARD RULES:
- EXACTLY 3 sentences.
- Sentence 1: open with a concrete technical identity (role + stack + scale). Never start with "I" or an LP phrase.
- Sentence 2: include a SPECIFIC metric pulled directly from the resume — use the actual number, no placeholder.
- Sentence 3: forward-looking and tied to this role's core technical mission.
- NEVER use: looking to, eager, passionate, innovative, fast-paced, dynamic, drive impactful, leverage my, successfully, seeking to, excited to, results-driven, team player.
- Never name the hiring company.
${company ? `- Mirror the hiring culture of ${company} in tone.` : ''}

Return JSON only: { "summary": string }`;

  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_RESUME_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Resume:\n"""\n${resumeText}\n"""` },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });
  try {
    return JSON.parse(r.choices[0].message.content).summary || '';
  } catch {
    return '';
  }
}

function sanitizeAnalysis(a) {
  a.bullet_rewrites = (a.bullet_rewrites || []).filter(b => {
    if (!b || typeof b.before !== 'string' || typeof b.after !== 'string') return false;
    if (!b.after.trim()) return false;
    if (startsWithLP(b.after)) return false;
    if (jaccard(b.before, b.after) > 0.7) return false;
    const firstOrig = (b.before.trim().split(/\s+/)[0] || '').toLowerCase();
    const firstNew  = (b.after.trim().split(/\s+/)[0] || '').toLowerCase();
    if (firstOrig && firstOrig === firstNew) return false;
    return true;
  });

  a.quick_wins = (a.quick_wins || []).filter(w => {
    if (!w || typeof w.after !== 'string' || !w.after.trim()) return false;
    if (startsWithLP(w.after)) return false;
    return true;
  });

  if (a.summary_rewrite) {
    if (LP_OPENER_RE.test(a.summary_rewrite) || BANNED_SUMMARY_RE.test(a.summary_rewrite)) {
      a.summary_rewrite = '';
    }
  }

  return a;
}

router.post('/analyze', analyzeRateLimit, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    if (typeof jobDescription !== 'string' || jobDescription.trim().length < 50) {
      return res.status(400).json({ message: 'Please paste a complete job description (at least 50 characters).' });
    }
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    let dataBuffer;
    if (resume.fileId) {
      const bucket = getBucket();
      const chunks = [];
      await new Promise((resolve, reject) => {
        const dl = bucket.openDownloadStream(resume.fileId);
        dl.on('data', (c) => chunks.push(c));
        dl.on('end', resolve);
        dl.on('error', reject);
      });
      dataBuffer = Buffer.concat(chunks);
    } else {
      const filePath = resume.path || path.join(__dirname, '../../uploads', resume.filename);
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Resume file not found' });
      }
      dataBuffer = fs.readFileSync(filePath);
    }
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    const taggedJD = parseJDSections(jobDescription);

    let pass1;
    try {
      pass1 = await extractKeywordsAndCompany(taggedJD);
    } catch (err) {
      if (err.status === 401) return res.status(500).json({ message: 'OpenAI API key is invalid or expired.' });
      if (err.status === 429) return res.status(429).json({ message: 'OpenAI rate limit reached. Please try again in a moment.' });
      return res.status(500).json({ message: 'AI service error during keyword extraction: ' + err.message });
    }

    // Support both field names in case the model returns the old key
    const detectedCompany = pass1.detected_company || pass1.company_detected || null;
    const scoredKeywords = annotateAndScore(pass1.keywords || [], jobDescription);
    if (scoredKeywords.length === 0) {
      return res.status(422).json({ message: 'Could not extract usable keywords from this job description. Please paste a more detailed JD.' });
    }

    let pass2;
    try {
      pass2 = await analyzeAgainstResume(resumeText, taggedJD, scoredKeywords, detectedCompany);
    } catch (err) {
      if (err.status === 401) return res.status(500).json({ message: 'OpenAI API key is invalid or expired.' });
      if (err.status === 429) return res.status(429).json({ message: 'OpenAI rate limit reached. Please try again in a moment.' });
      return res.status(500).json({ message: 'AI service error during analysis: ' + err.message });
    }

    const merged = mergeAnalysis(scoredKeywords, pass2, detectedCompany, pass1.or_groups || []);
    const final = sanitizeAnalysis(merged);

    if (!final.summary_rewrite) {
      try {
        const retry = await regenerateSummary(resumeText, scoredKeywords, detectedCompany);
        if (retry && !LP_OPENER_RE.test(retry) && !BANNED_SUMMARY_RE.test(retry)) {
          final.summary_rewrite = retry.trim();
        }
      } catch {
        // best-effort — leave summary empty if retry also fails
      }
    }

    res.json(final);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ message: 'Failed to analyze resume', error: error.message });
  }
});

module.exports = router;