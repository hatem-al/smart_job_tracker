import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

function formatDateForInput(dateString) {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => setError('Failed to load job data.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.patch(`/api/jobs/${id}`, job);
      navigate('/jobs');
    } catch {
      setError('Failed to update job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setJob(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!job && !loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30">
        <div className="bg-white rounded-xl p-8 text-center shadow-xl">
          <p className="text-slate-700 font-medium">Job not found.</p>
          <button onClick={() => navigate('/jobs')} className="btn-primary mt-4">Back to Applications</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-30">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Edit Application</h2>
          <button onClick={() => navigate('/jobs')} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="form-label">Company</label>
                <input type="text" id="company" name="company" value={job.company} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label htmlFor="title" className="form-label">Job title</label>
                <input type="text" id="title" name="title" value={job.title} onChange={handleChange} required className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="form-label">Status</label>
                <select id="status" name="status" value={job.status} onChange={handleChange} className="input-field">
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Saved">Saved</option>
                </select>
              </div>
              <div>
                <label htmlFor="date" className="form-label">Date</label>
                <input type="date" id="date" name="date" value={formatDateForInput(job.date)} onChange={handleChange} required className="input-field" />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="form-label">Job description</label>
              <textarea id="description" name="description" value={job.description || ''} onChange={handleChange} rows="4" className="input-field" placeholder="Paste the job description…" />
            </div>

            <div>
              <label htmlFor="notes" className="form-label">Notes</label>
              <textarea id="notes" name="notes" value={job.notes || ''} onChange={handleChange} rows="3" className="input-field" placeholder="Interview notes, contacts, salary info…" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/jobs')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving…
                  </>
                ) : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;
