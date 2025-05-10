import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import axios from '../utils/axios';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const ResumeOptimizer = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resumes');
      setResumes(response.data);
    } catch (error) {
      setError('Failed to load resumes. Please try again.');
      console.error('Error fetching resumes:', error);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedResume || !jobDescription) {
      setError('Please select a resume and provide a job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/resumes/analyze', {
        resumeId: selectedResume,
        jobDescription
      });
      setAnalysis(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to analyze resume');
      console.error('Error analyzing resume:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="glass-effect p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Resume Optimizer</h2>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="form-group">
              <label htmlFor="resume" className="form-label">Select Resume</label>
              <select
                id="resume"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a resume</option>
                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.title || resume.filename}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="jobDescription" className="form-label">Job Description</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="input-field"
                rows="6"
                required
                placeholder="Paste the job description here..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  'Analyze Resume'
                )}
              </button>
            </div>
          </form>

          {analysis && (
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
              {analysis.summary && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-gray-700 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">{analysis.summary}</p>
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-8 mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Matching Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchingKeywords && analysis.matchingKeywords.length > 0 ? (
                      analysis.matchingKeywords.map((kw, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{kw}</span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords && analysis.missingKeywords.length > 0 ? (
                      analysis.missingKeywords.map((kw, idx) => (
                        <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">{kw}</span>
                      ))
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Suggestions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  {analysis.suggestions && analysis.suggestions.length > 0 ? (
                    analysis.suggestions.map((s, idx) => (
                      <li key={idx} className="text-gray-700">{s}</li>
                    ))
                  ) : (
                    <li className="text-gray-400">No suggestions provided.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Resume Text</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-64 whitespace-pre-wrap">{analysis.resumeText}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResumeOptimizer; 