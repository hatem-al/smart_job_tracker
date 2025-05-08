import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const ResumeOptimizer = () => {
  const [selectedResume, setSelectedResume] = useState('');
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/resume');
      setResumes(response.data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      setError('Failed to fetch resumes. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResume || !jobDescription) {
      setError('Please select a resume and provide a job description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5050/api/resume/analyze', {
        resumeId: selectedResume,
        jobDescription: jobDescription
      });
      setAnalysis(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Resume Optimizer</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume
          </label>
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
                {resume.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            rows="6"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="input-field"
            placeholder="Paste the job description here..."
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>

      {analysis && (
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-green-50">
                <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  Matching Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card bg-red-50">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                  <XCircleIcon className="h-5 w-5 mr-1" />
                  Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <LightBulbIcon className="h-5 w-5 mr-1" />
              Suggestions for Improvement
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-blue-700">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-gray-50">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Resume Preview</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {analysis.resumeText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeOptimizer; 