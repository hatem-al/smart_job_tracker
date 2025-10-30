import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import axios from '../utils/axios';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Please select a PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('title', file.name);

    try {
      await axios.post('/api/resumes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      e.target.reset();
      fetchResumes();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload resume');
      console.error('Error uploading resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      await axios.delete(`/api/resumes/${id}`);
      setResumes(resumes.filter(resume => resume._id !== id));
    } catch (error) {
      setError('Failed to delete resume');
      console.error('Error deleting resume:', error);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`/api/resumes/${id}/file`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Optional: revoke after some delay to allow the tab to load
      setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      setError('Failed to open resume. Please try again.');
      console.error('Error opening resume:', err);
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

        <div className="glass-effect p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Resume</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="resume" className="form-label">Select PDF File</label>
              <input
                type="file"
                id="resume"
                accept=".pdf"
                onChange={handleFileChange}
                className="input-field"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Resume'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="glass-effect p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Resumes</h2>
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <div key={resume._id} className="card hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {resume.title || resume.filename}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(resume._id)}
                      className="btn-primary"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeManager; 