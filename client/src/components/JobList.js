import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import Navigation from './Navigation';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await axios.delete(`/api/jobs/${id}`);
        setJobs(jobs.filter(job => job._id !== id));
      } catch (err) {
        setError('Failed to delete job. Please try again.');
        console.error('Error deleting job:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Job Applications</h1>
          <button
            onClick={() => navigate('/jobs/new')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Job
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    className="hover:bg-blue-50 transition-all duration-200 transform hover:scale-[1.01] shadow-sm hover:shadow-lg cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${job.status === 'Applied' ? 'bg-blue-100 text-blue-800' : 
                          job.status === 'Interview' ? 'bg-yellow-100 text-yellow-800' :
                          job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                          job.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}
                        transition-colors duration-200`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(job.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.resume ? job.resume.title : 'No resume'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/jobs/edit/${job._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="text-red-600 hover:text-red-900 transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default JobList; 