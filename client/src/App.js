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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute>
            <JobList />
          </ProtectedRoute>
        } />
        <Route path="/jobs/new" element={
          <ProtectedRoute>
            <JobForm />
          </ProtectedRoute>
        } />
        <Route path="/jobs/edit/:id" element={
          <ProtectedRoute>
            <EditJob />
          </ProtectedRoute>
        } />
        <Route path="/resumes" element={
          <ProtectedRoute>
            <ResumeManager />
          </ProtectedRoute>
        } />
        <Route path="/resume-optimizer" element={
          <ProtectedRoute>
            <ResumeOptimizer />
          </ProtectedRoute>
        } />
        
        {/* Redirect to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
