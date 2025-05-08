import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EditJob from './EditJob';

const JobList = ({ jobs, onJobDeleted, onJobUpdated }) => {
  const [editingJob, setEditingJob] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        await axios.delete(`http://localhost:5050/api/jobs/${id}`);
        onJobDeleted(id);
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
  };

  const handleJobUpdated = (updatedJob) => {
    onJobUpdated(updatedJob);
    setEditingJob(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      Applied: 'bg-blue-100 text-blue-800',
      Interview: 'bg-yellow-100 text-yellow-800',
      Offer: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Saved: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job._id} className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <p className="text-gray-600">{job.company}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(job)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(job._id)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
              {job.status}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {new Date(job.date).toLocaleDateString()}
            </span>
          </div>
          {job.resumeUsed && (
            <p className="mt-2 text-sm text-gray-600">
              Resume: {job.resumeUsed}
            </p>
          )}
          {job.notes && (
            <p className="mt-2 text-sm text-gray-600">
              Notes: {job.notes}
            </p>
          )}
        </div>
      ))}

      {editingJob && (
        <EditJob
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onJobUpdated={handleJobUpdated}
        />
      )}
    </div>
  );
};

export default JobList; 