import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { SparklesIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors">
      {copied ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const PRIORITY_STYLES = {
  high:   'bg-red-50 text-red-700 ring-red-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low:    'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const STATUS_STYLES = {
  present: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  missing: 'bg-red-50 text-red-700 ring-red-600/20',
};

// Flatten the {present, partial, missing} keyword buckets into a flat array for chip rendering
function flattenKeywords(kwa) {
  if (!kwa) return [];
  return [
    ...(kwa.present || []).map(k => ({ ...k, status: 'present' })),
    ...(kwa.partial || []).map(k => ({ ...k, status: 'partial' })),
    ...(kwa.missing || []).map(k => ({ ...k, status: 'missing' })),
  ];
}

const ResumeOptimizer = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/resumes').then(r => setResumes(r.data)).catch(() => setError('Failed to load resumes.'));
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedResume || !jobDescription) {
      setError('Please select a resume and paste a job description');
      return;
    }
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const r = await axios.post('/api/resumes/analyze', { resumeId: selectedResume, jobDescription });
      setAnalysis(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const kwa = analysis?.keyword_analysis;
  const allKeywords = flattenKeywords(kwa);
  const presentCount = kwa?.present?.length ?? 0;
  const partialCount = kwa?.partial?.length ?? 0;
  const missingCount = kwa?.missing?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Resume Optimizer</h1>
        <p className="text-sm text-slate-500 mt-0.5">ATS analysis, bullet rewrites, and a tailored summary — powered by GPT-4o.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="card p-6">
        <form onSubmit={handleAnalyze} className="space-y-5">
          <div>
            <label htmlFor="resume" className="form-label">Resume</label>
            <select id="resume" value={selectedResume} onChange={e => setSelectedResume(e.target.value)} className="input-field" required>
              <option value="">Select a resume…</option>
              {resumes.map(r => <option key={r._id} value={r._id}>{r.title || r.filename}</option>)}
            </select>
            {resumes.length === 0 && (
              <p className="text-xs text-slate-400 mt-1.5">No resumes uploaded yet. <a href="/resumes" className="text-indigo-600 hover:underline">Upload one first</a>.</p>
            )}
          </div>
          <div>
            <label htmlFor="jobDescription" className="form-label">Job description</label>
            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="input-field"
              rows="7"
              required
              placeholder="Paste the full job description here…"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Analyze Resume
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {analysis && !analysis.summary_rewrite && !analysis.keyword_analysis && (
        <div className="card p-6">
          <p className="text-sm text-slate-500 mb-2">Raw response (unexpected format):</p>
          <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-64">{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}

      {analysis && (
        <div className="space-y-5">

          {/* Company detection banner */}
          {analysis.detected_company && (
            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg">
              <SparklesIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <p className="text-sm text-indigo-800">
                <span className="font-semibold">{analysis.detected_company}</span> detected —{' '}
                {analysis.amazon_detected
                  ? 'bullets and summary are framed around Leadership Principles.'
                  : 'analysis mirrors their hiring culture and vocabulary.'}
              </p>
            </div>
          )}

          {/* Summary rewrite */}
          {analysis.summary_rewrite && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Rewritten Summary</h3>
                <CopyButton text={analysis.summary_rewrite} />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed border-l-4 border-indigo-400 pl-4 bg-indigo-50/40 py-3 rounded-r-lg">
                {analysis.summary_rewrite}
              </p>
            </div>
          )}

          {/* Keyword analysis */}
          {allKeywords.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">ATS Keyword Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { status: 'present', count: presentCount, label: 'Present',       color: 'text-emerald-600' },
                  { status: 'partial', count: partialCount, label: 'Partial match', color: 'text-amber-600'   },
                  { status: 'missing', count: missingCount, label: 'Missing',       color: 'text-red-600'     },
                ].map(({ status, count, label, color }) => (
                  <div key={status} className="text-center p-3 rounded-lg bg-slate-50">
                    <p className={`text-2xl font-bold ${color}`}>{count}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {allKeywords.map((kw, i) => {
                  const tip = kw.status === 'partial' && kw.gap
                    ? `Partial — ${kw.gap}${kw.evidence ? `\nMatch: "${kw.evidence}"` : ''}`
                    : kw.evidence
                      ? `Match: "${kw.evidence}"`
                      : undefined;
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 max-w-full ${STATUS_STYLES[kw.status] || STATUS_STYLES.missing}`}
                      title={tip}
                    >
                      <span className="truncate max-w-[18rem]">{kw.keyword}</span>
                    </span>
                  );
                })}
              </div>
              {(allKeywords.some(k => k.evidence || k.gap)) && (
                <p className="text-xs text-slate-400 mt-3">Hover a keyword to see the matching resume line or partial gap.</p>
              )}
            </div>
          )}

          {/* Priority gaps */}
          {analysis.priority_gaps?.length > 0 && (() => {
            const visible = analysis.priority_gaps.filter(g => !g.suppress);
            const suppressed = analysis.priority_gaps.filter(g => g.suppress);
            if (!visible.length) return null;
            return (
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Priority Gaps</h3>
                <div className="space-y-3">
                  {visible.map((gap, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex-shrink-0 pt-0.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${PRIORITY_STYLES[gap.priority] || PRIORITY_STYLES.low}`}>
                          {gap.priority}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{gap.keyword}</span>
                          <span className="text-xs text-slate-400">score {gap.score}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{gap.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {suppressed.length > 0 && (
                  <p className="text-xs text-slate-400 mt-3">
                    {suppressed.length} low-priority gap{suppressed.length > 1 ? 's' : ''} hidden ({suppressed.map(g => g.keyword).join(', ')}).
                  </p>
                )}
              </div>
            );
          })()}

          {/* Bullet rewrites */}
          {analysis.bullet_rewrites?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Bullet Point Rewrites</h3>
              <div className="space-y-5">
                {analysis.bullet_rewrites.map((b, i) => (
                  <div key={i} className="space-y-2">
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                      <p className="text-xs font-medium text-red-600 mb-1">Before</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{b.before}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-emerald-600 mb-1">After</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{b.after}</p>
                        </div>
                        <CopyButton text={b.after} />
                      </div>
                    </div>
                    {b.rationale && (
                      <p className="text-xs text-slate-400 pl-1">{b.rationale}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick wins */}
          {analysis.quick_wins?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Quick Wins <span className="text-slate-400 font-normal">— under 10 minutes each</span>
              </h3>
              <ol className="space-y-3">
                {analysis.quick_wins.map((win, i) => (
                  <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-xs font-medium text-slate-500">{win.location}</span>
                    </div>
                    <div className="px-3 pb-3 space-y-1.5">
                      {win.before && (
                        <div className="px-2.5 py-1.5 rounded bg-red-50 border border-red-100">
                          <p className="text-xs font-medium text-red-500 mb-0.5">Before</p>
                          <p className="text-xs text-slate-700">{win.before}</p>
                        </div>
                      )}
                      {win.after && (
                        <div className="px-2.5 py-1.5 rounded bg-emerald-50 border border-emerald-100">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-emerald-600 mb-0.5">After</p>
                              <p className="text-xs text-slate-700">{win.after}</p>
                            </div>
                            <CopyButton text={win.after} />
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default ResumeOptimizer;
