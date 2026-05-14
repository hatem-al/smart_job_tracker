import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  Applied:   '#6366f1',
  Interview: '#f59e0b',
  Offer:     '#10b981',
  Rejected:  '#ef4444',
  Saved:     '#94a3b8',
};

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

function getStatusCounts(jobs) {
  const counts = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Saved: 0 };
  jobs.forEach(job => { if (counts[job.status] !== undefined) counts[job.status]++; });
  return counts;
}

function getPieChartData(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  let startAngle = 0;
  return Object.entries(counts).map(([status, count]) => {
    const angle = total ? (count / total) * 360 : 0;
    const data = { status, count, color: STATUS_COLORS[status], startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return data;
  });
}

function describeArc(cx, cy, r, ri, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const iStart = polarToCartesian(cx, cy, ri, endAngle);
  const iEnd = polarToCartesian(cx, cy, ri, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', start.x, start.y,
    'A', r, r, 0, largeArc, 0, end.x, end.y,
    'L', iEnd.x, iEnd.y,
    'A', ri, ri, 0, largeArc, 1, iStart.x, iStart.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getFilteredJobsByTime(jobs, timeRange) {
  const now = new Date();
  return jobs.filter(job => {
    const d = new Date(job.date);
    if (timeRange === 'week')  return (now - d) <= 7  * 86400000;
    if (timeRange === 'month') return (now - d) <= 30 * 86400000;
    if (timeRange === 'year')  return (now - d) <= 365 * 86400000;
    return true;
  });
}

const StatCard = ({ icon: Icon, iconBg, iconColor, value, label }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    axios.get('/api/jobs')
      .then(r => { setJobs(r.data); setError(''); })
      .catch(() => setError('Failed to load jobs. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFilteredJobs(jobs.filter(job => {
      const matchesSearch =
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    }));
  }, [jobs, searchTerm, statusFilter]);

  const timeFilteredJobs = getFilteredJobsByTime(filteredJobs, timeRange);
  const totalApplications = timeFilteredJobs.length;
  const statusCounts = getStatusCounts(timeFilteredJobs);
  const pieData = getPieChartData(statusCounts);
  const successRate = totalApplications > 0
    ? ((statusCounts['Offer'] || 0) / totalApplications * 100).toFixed(1)
    : '0.0';
  const rejectionRate = totalApplications > 0
    ? ((statusCounts['Rejected'] || 0) / totalApplications * 100).toFixed(1)
    : '0.0';
  const responseTimes = timeFilteredJobs
    .filter(j => j.status !== 'Applied' && j.status !== 'Saved' && j.statusChangedAt)
    .map(j => Math.abs((new Date(j.statusChangedAt) - new Date(j.date)) / 86400000));
  const avgResponse = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const nonZeroPie = pieData.filter(s => s.count > 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track and analyze your job search progress.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ChartBarIcon} iconBg="bg-indigo-50" iconColor="text-indigo-600" value={totalApplications} label="Total Applications" />
        <StatCard icon={CheckCircleIcon} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={`${successRate}%`} label="Success Rate" />
        <StatCard icon={ClockIcon} iconBg="bg-amber-50" iconColor="text-amber-600" value={avgResponse === '—' ? '—' : `${avgResponse}d`} label="Avg. Response Time" />
        <StatCard icon={XCircleIcon} iconBg="bg-red-50" iconColor="text-red-600" value={`${rejectionRate}%`} label="Rejection Rate" />
      </div>

      {/* Chart + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut chart */}
        <div className="card p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Status Distribution</h3>
          <div className="flex flex-col items-center gap-5">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {totalApplications === 0 ? (
                <path d={describeArc(80, 80, 68, 44, 0, 359.99)} fill="#f1f5f9" />
              ) : nonZeroPie.length === 1 ? (
                <>
                  <circle cx="80" cy="80" r="68" fill={nonZeroPie[0].color} />
                  <circle cx="80" cy="80" r="44" fill="white" />
                </>
              ) : (
                nonZeroPie.map(slice => (
                  <path
                    key={slice.status}
                    d={describeArc(80, 80, 68, 44, slice.startAngle, slice.endAngle)}
                    fill={slice.color}
                  />
                ))
              )}
              <text x="80" y="76" textAnchor="middle" className="text-xl font-bold" style={{ fontSize: 22, fontWeight: 700, fill: '#0f172a' }}>{totalApplications}</text>
              <text x="80" y="93" textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>total</text>
            </svg>
            <ul className="w-full space-y-1.5">
              {pieData.map(s => (
                <li key={s.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-slate-600">{s.status}</span>
                  </div>
                  <span className="font-medium text-slate-900">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-900">Filter Applications</h3>
          <input
            type="text"
            className="input-field"
            placeholder="Search by company or job title…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Saved">Saved</option>
            </select>
            <select className="input-field" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
              <option value="all">All time</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="year">Last year</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-auto">
            Showing {timeFilteredJobs.length} of {jobs.length} applications
            {timeRange !== 'all' && ` · filtered by time`}
          </p>
        </div>
      </div>

      {/* Recent applications */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent Applications</h3>
          <button onClick={() => navigate('/jobs')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all →
          </button>
        </div>
        {timeFilteredJobs.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No applications match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeFilteredJobs.slice(0, 10).map(job => (
                  <tr
                    key={job._id}
                    onClick={() => navigate(`/jobs/edit/${job._id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">{job.company}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-600">{job.title}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={job.status} /></td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{new Date(job.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
