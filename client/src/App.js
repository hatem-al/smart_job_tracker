import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import ResumeManager from './components/ResumeManager';
import ResumeOptimizer from './components/ResumeOptimizer';
import ProtectedRoute from './components/ProtectedRoute';
import EditJob from './components/EditJob';
import Layout from './components/Layout';

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/jobs" element={<ProtectedLayout><JobList /></ProtectedLayout>} />
        <Route path="/jobs/new" element={<ProtectedLayout><JobForm /></ProtectedLayout>} />
        <Route path="/jobs/edit/:id" element={<ProtectedLayout><EditJob /></ProtectedLayout>} />
        <Route path="/resumes" element={<ProtectedLayout><ResumeManager /></ProtectedLayout>} />
        <Route path="/resume-optimizer" element={<ProtectedLayout><ResumeOptimizer /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
