import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_BADGE = {
  Applied:   'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Interview: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Offer:     'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rejected:  'bg-red-50 text-red-700 ring-red-600/20',
  Saved:     'bg-slate-100 text-slate-600 ring-slate-500/20',
};

function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] || STATUS_BADGE.Saved;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}>
      {status}
    </span>
  );
}

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/jobs')
      .then(r => { setJobs(r.data); setError(''); })
      .catch(() => setError('Failed to load jobs. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job application?')) return;
    try {
      await axios.delete(`/api/jobs/${id}`);
      setJobs(jobs.filter(j => j._id !== id));
    } catch {
      setError('Failed to delete job. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{jobs.length} total application{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/jobs/new')} className="btn-primary">
          <PlusIcon className="w-4 h-4" />
          Add Application
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {jobs.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PlusIcon className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No applications yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Add your first job application to get started.</p>
          <button onClick={() => navigate('/jobs/new')} className="btn-primary mx-auto">
            <PlusIcon className="w-4 h-4" />
            Add Application
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Position</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Resume</th>
                  <th className="px-6 py-3.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{job.company}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{job.title}</td>
                    <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(job.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{job.resume ? job.resume.title : <span className="text-slate-300">—</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/jobs/edit/${job._id}`)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobList;
