import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Helper to format date for input[type=date]
function formatDateForInput(dateString) {
  if (!dateString) return '';
  return dateString.split('T')[0];
}

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`/api/jobs/${id}`);
        setJob(response.data);
      } catch (err) {
        setError('Failed to load job data.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.patch(`http://localhost:5050/api/jobs/${id}`, job);
      navigate('/jobs');
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!job) return <div>No job found.</div>;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Job Application</h2>
            <button
              onClick={() => navigate('/jobs')}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={job.company}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={job.title}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                name="status"
                value={job.status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Saved">Saved</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formatDateForInput(job.date)}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={job.notes}
                onChange={handleChange}
                rows="3"
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700">Job Description</label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                value={job.jobDescription}
                onChange={handleChange}
                rows="5"
                className="input-field"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob; 