import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobForm from './components/JobForm';
import JobList from './components/JobList';
import ResumeOptimizer from './components/ResumeOptimizer';
import ResumeManager from './components/ResumeManager';
import Dashboard from './components/Dashboard';

function App() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'jobs', 'resume', or 'resumes'

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleJobAdded = (newJob) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
  };

  const handleJobDeleted = (id) => {
    setJobs(prevJobs => prevJobs.filter(job => job._id !== id));
  };

  const handleJobEdit = (job) => {
    setEditingJob(job);
  };

  const handleJobUpdated = (updatedJob) => {
    setJobs(jobs.map(job => job._id === updatedJob._id ? updatedJob : job));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Smart Job Tracker</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`${
                    activeTab === 'jobs'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Job Applications
                </button>
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`${
                    activeTab === 'resume'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Resume Optimizer
                </button>
                <button
                  onClick={() => setActiveTab('resumeManager')}
                  className={`${
                    activeTab === 'resumeManager'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Resume Manager
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <JobForm onJobAdded={handleJobAdded} />
            <JobList 
              jobs={jobs} 
              onJobDeleted={handleJobDeleted} 
              onJobUpdated={handleJobUpdated}
            />
          </div>
        )}
        {activeTab === 'resume' && <ResumeOptimizer />}
        {activeTab === 'resumeManager' && <ResumeManager />}
        {activeTab === 'dashboard' && <Dashboard jobs={jobs} />}
      </main>
    </div>
  );
}

export default App;
