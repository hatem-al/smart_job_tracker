import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { DocumentTextIcon, EyeIcon, TrashIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/resumes').then(r => setResumes(r.data)).catch(() => setError('Failed to load resumes.'));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    const isPdf = !!f && (f.type?.toLowerCase().includes('pdf') || f.name?.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.pdf$/i, ''));
      setError('');
    } else {
      setFile(null);
      setError('Please select a PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload'); return; }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('title', title.trim() || file.name);
    try {
      await axios.post('/api/resumes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFile(null);
      setTitle('');
      e.target.reset();
      const r = await axios.get('/api/resumes');
      setResumes(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await axios.delete(`/api/resumes/${id}`);
      setResumes(resumes.filter(r => r._id !== id));
    } catch {
      setError('Failed to delete resume');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axios.get(`/api/resumes/${id}/file`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch {
      setError('Failed to open resume. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resumes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload and manage your resume PDFs.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Upload card */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Upload New Resume</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="resumeFile" className="form-label">PDF file</label>
            <label
              htmlFor="resumeFile"
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
            >
              <CloudArrowUpIcon className={`w-8 h-8 ${file ? 'text-indigo-500' : 'text-slate-300'}`} />
              <span className="text-sm text-slate-600">
                {file ? <span className="font-medium text-indigo-600">{file.name}</span> : 'Click to choose a PDF or drag & drop'}
              </span>
              <span className="text-xs text-slate-400">Max 5 MB</span>
              <input type="file" id="resumeFile" accept=".pdf" onChange={handleFileChange} className="sr-only" />
            </label>
          </div>
          <div>
            <label htmlFor="resumeTitle" className="form-label">Title</label>
            <input type="text" id="resumeTitle" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="e.g. Software Engineer Resume 2025" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading || !file}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Uploading…
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4" />
                  Upload Resume
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Resume list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Your Resumes ({resumes.length})</h2>
        {resumes.length === 0 ? (
          <div className="card p-12 text-center">
            <DocumentTextIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No resumes uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map(resume => (
              <div key={resume._id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{resume.title || resume.filename}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleView(resume._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeManager;
