import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { BriefcaseIcon } from '@heroicons/react/24/solid';
import axios from '../utils/axios';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem('token')) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <BriefcaseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">JobTracker</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug">
            Organize your job search,<br />land your next role.
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Track every application, manage your resumes, and use AI to tailor your resume for each role — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[['47+', 'Applications tracked'], ['2.4×', 'More interviews'], ['AI', 'Resume optimizer']].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-slate-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-xs">© 2025 Smart Job Tracker</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">JobTracker</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required autoFocus />
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-700">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
