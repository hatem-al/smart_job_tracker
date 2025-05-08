import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DocumentArrowUpIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a PDF file');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide both a title and a PDF file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('title', title);

    try {
      await axios.post('http://localhost:5050/api/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTitle('');
      setFile(null);
      fetchResumes();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Error uploading resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5050/api/resume/${id}`);
      fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      setError('Failed to delete resume. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Resume</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Resume Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g., Software Engineer Resume 2024"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Resume (PDF)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 10MB</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name}
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </form>
      </div>

      {/* Resume List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Resumes</h2>
        <div className="space-y-4">
          {resumes.map((resume) => (
            <div key={resume._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{resume.title}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(resume.uploadDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <a
                  href={`http://localhost:5050/api/resume/${resume._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-600"
                  title="View Resume"
                >
                  <EyeIcon className="h-5 w-5" />
                </a>
                <button
                  onClick={() => handleDelete(resume._id)}
                  className="p-2 text-gray-600 hover:text-red-600"
                  title="Delete Resume"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
          {resumes.length === 0 && (
            <p className="text-gray-500 text-center py-4">No resumes uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeManager; 