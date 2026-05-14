import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

const JobForm = () => {
  const [formData, setFormData] = useState({
    title: '', company: '', status: 'Applied',
    date: new Date().toISOString().split('T')[0],
    resume: '', notes: '', description: '',
  });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/resumes').then(r => setResumes(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/jobs', formData);
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Application</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track a new job application.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="title" className="form-label">Job title <span className="text-red-500">*</span></label>
            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="Software Engineer" required />
          </div>
          <div>
            <label htmlFor="company" className="form-label">Company <span className="text-red-500">*</span></label>
            <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} className="input-field" placeholder="Acme Corp" required />
          </div>
          <div>
            <label htmlFor="status" className="form-label">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className="input-field">
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Saved">Saved</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="form-label">Application date <span className="text-red-500">*</span></label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="resume" className="form-label">Resume used</label>
            <select id="resume" name="resume" value={formData.resume} onChange={handleChange} className="input-field">
              <option value="">No resume selected</option>
              {resumes.map(r => <option key={r._id} value={r._id}>{r.title || r.filename}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="form-label">Job description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="input-field" rows="4" placeholder="Paste the job description here…" />
        </div>

        <div>
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="input-field" rows="3" placeholder="Interview notes, contacts, salary info…" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/jobs')} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Saving…
              </>
            ) : 'Add Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
