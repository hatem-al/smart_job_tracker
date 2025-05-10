import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import axios from '../utils/axios';
import { ChartBarIcon, MagnifyingGlassIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  Applied: '#3b82f6',
  Interview: '#f59e42',
  Offer: '#10b981',
  Rejected: '#ef4444',
  Saved: '#6b7280',
};

function getStatusCounts(jobs) {
  const counts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Saved: 0 };
  jobs.forEach(job => {
    if (counts[job.status] !== undefined) counts[job.status]++;
  });
  return counts;
}

function getPieChartData(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  let startAngle = 0;
  return Object.entries(counts).map(([status, count]) => {
    const angle = total ? (count / total) * 360 : 0;
    const data = {
      status,
      count,
      color: STATUS_COLORS[status],
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return data;
  });
}

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month', 'year'

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

  const getStatusCount = (status) => {
    return jobs.filter(job => job.status === status).length;
  };

  // Calculate statistics
  const totalApplications = jobs.length;
  const statusCounts = getStatusCounts(jobs);
  const pieData = getPieChartData(statusCounts);

  // Calculate success rate
  const successCount = jobs.filter(job => job.status === 'Offer').length;
  const successRate = totalApplications > 0 ? (successCount / totalApplications) * 100 : 0;

  // Calculate average response time
  const responseTimes = jobs
    .filter(job => job.status !== 'Applied' && job.status !== 'Saved' && job.statusChangedAt)
    .map(job => {
      const appliedDate = new Date(job.date);
      const responseDate = new Date(job.statusChangedAt);
      return Math.abs((responseDate - appliedDate) / (1000 * 60 * 60 * 24)); // Always positive days
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Search and Filter Section */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by company or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
            <div className="flex flex-col md:flex-row items-center gap-8">
              <svg width="220" height="220" viewBox="0 0 220 220">
                <g>
                  {pieData.map((slice, idx) => (
                    slice.count > 0 && (
                      <path
                        key={slice.status}
                        d={describeArc(110, 110, 100, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        stroke="#fff"
                        strokeWidth="2"
                      >
                      </path>
                    )
                  ))}
                </g>
              </svg>
              <div>
                <ul className="space-y-2">
                  {pieData.map(slice => (
                    <li key={slice.status} className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded-full" style={{ background: slice.color }}></span>
                      <span className="font-medium text-gray-700">{slice.status}</span>
                      <span className="text-gray-500">({slice.count})</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-gray-600">Total Applications: <span className="font-semibold">{totalApplications}</span></div>
              </div>
            </div>
          </div>

          {/* Filtered Results Count */}
          <div className="text-sm text-gray-600">
            Showing {timeFilteredJobs.length} of {totalApplications} applications
            {timeRange !== 'all' && ` in the last ${timeRange}`}
          </div>
        </div>

        <div className="glass-effect p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Applications</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeFilteredJobs.slice(0, 5).map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        job.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'Interview' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper to create SVG arc
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'L', cx, cy,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default Dashboard; 