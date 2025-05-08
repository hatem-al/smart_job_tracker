import React, { useState, useEffect } from 'react';
import { ChartBarIcon, MagnifyingGlassIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const Dashboard = ({ jobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month', 'year'

  // Calculate statistics
  const totalApplications = jobs.length;
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate success rate
  const successCount = jobs.filter(job => job.status === 'Offer').length;
  const successRate = totalApplications > 0 ? (successCount / totalApplications) * 100 : 0;

  // Calculate average response time
  const responseTimes = jobs
    .filter(job => job.status !== 'Applied' && job.status !== 'Saved')
    .map(job => {
      const appliedDate = new Date(job.date);
      const responseDate = new Date(job.lastUpdated);
      return (responseDate - appliedDate) / (1000 * 60 * 60 * 24); // Convert to days
    });

  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  // Filter jobs based on time range
  const getFilteredJobsByTime = (jobs) => {
    const now = new Date();
    return jobs.filter(job => {
      const jobDate = new Date(job.date);
      switch (timeRange) {
        case 'week':
          return (now - jobDate) <= 7 * 24 * 60 * 60 * 1000;
        case 'month':
          return (now - jobDate) <= 30 * 24 * 60 * 60 * 1000;
        case 'year':
          return (now - jobDate) <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    });
  };

  const statusColors = {
    Applied: 'bg-blue-500',
    Interview: 'bg-yellow-500',
    Offer: 'bg-green-500',
    Rejected: 'bg-red-500',
    Saved: 'bg-gray-500'
  };

  // Filter jobs based on search term and status
  useEffect(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = 
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter]);

  const timeFilteredJobs = getFilteredJobsByTime(filteredJobs);

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search by company or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Saved">Saved</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              className="input-field"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{timeFilteredJobs.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {averageResponseTime.toFixed(1)} days
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Rejection Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {((statusCounts['Rejected'] || 0) / totalApplications * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status Distribution</h3>
        <div className="space-y-6">
          {/* Bar Chart */}
          <div className="h-64 flex items-end space-x-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = (count / totalApplications) * 100;
              return (
                <div key={status} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className={`w-full ${statusColors[status]} rounded-t transition-all duration-300 ease-in-out group-hover:opacity-80`}
                      style={{ height: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-white text-sm font-medium drop-shadow-lg">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-900">{status}</p>
                    <p className="text-xs text-gray-500">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{status}</span>
                  <span className="text-gray-500 ml-1">({count})</span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const percentage = (count / totalApplications) * 100;
              return (
                <div key={status} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{status}</span>
                    <span className={`text-xs font-medium ${statusColors[status].replace('bg-', 'text-')}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtered Results Count */}
      <div className="text-sm text-gray-600">
        Showing {timeFilteredJobs.length} of {totalApplications} applications
        {timeRange !== 'all' && ` in the last ${timeRange}`}
      </div>
    </div>
  );
};

export default Dashboard; 