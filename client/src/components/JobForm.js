import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobForm = ({ onJobAdded, initialData = null }) => {
  const [formData, setFormData] = useState(initialData || {
    company: '',
    title: '',
    status: 'Applied',
    date: new Date().toISOString().split('T')[0],
    resumeUsed: '',
    notes: '',
    jobDescription: ''
  });
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/resume');
      setResumes(response.data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5050/api/jobs', formData);
      onJobAdded(response.data);
      if (!initialData) {
        setFormData({
          company: '',
          title: '',
          status: 'Applied',
          date: new Date().toISOString().split('T')[0],
          resumeUsed: '',
          notes: '',
          jobDescription: ''
        });
      }
    } catch (error) {
      console.error('Error adding job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
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
          value={formData.title}
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
          value={formData.status}
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
          value={formData.date}
          onChange={handleChange}
          required
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="resumeUsed" className="block text-sm font-medium text-gray-700">Resume Used</label>
        <select
          id="resumeUsed"
          name="resumeUsed"
          value={formData.resumeUsed}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">Select a resume</option>
          {resumes.map((resume) => (
            <option key={resume._id} value={resume.title}>
              {resume.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
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
          value={formData.jobDescription}
          onChange={handleChange}
          rows="5"
          className="input-field"
        />
      </div>

      <button 
        type="submit" 
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Saving...' : (initialData ? 'Update Job' : 'Add Job')}
      </button>
    </form>
  );
};

export default JobForm; 