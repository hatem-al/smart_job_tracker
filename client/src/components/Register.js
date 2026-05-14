import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { BriefcaseIcon } from '@heroicons/react/24/solid';
import axios from '../utils/axios';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (localStorage.getItem('token')) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
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
            Your job search,<br />finally organized.
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Join thousands of job seekers who track applications, optimize resumes with AI, and land more interviews.
          </p>
          <ul className="mt-8 space-y-3">
            {['Track every application in one place', 'AI-powered resume optimization', 'Visual dashboard with insights'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
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

          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">Start tracking your job search today</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">Full name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Alex Johnson" required autoFocus />
            </div>
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Min. 6 characters" required minLength="6" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" placeholder="••••••••" required minLength="6" />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
