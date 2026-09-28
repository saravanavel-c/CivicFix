import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintDetail from './pages/ComplaintDetail';
import NearbyIssues from './pages/NearbyIssues';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DepartmentComplaintDetails from './pages/DepartmentComplaintDetails';
import DepartmentHeatmap from './pages/DepartmentHeatmap';
import DepartmentPrediction from './pages/DepartmentPrediction';
import WorkerDashboard from './pages/WorkerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dedicated Login Route outside layout */}
        <Route path="/login" element={<Login />} />

        {/* Main Application Shell with Layout */}
        <Route path="/" element={<Layout />}>
          {/* Default entry redirects to login or citizen dashboard */}
          <Route index element={<Navigate to="/login" replace />} />
          
          {/* 1. Citizen Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="citizen/dashboard" element={<Dashboard />} />
          <Route path="citizen/profile" element={<Profile />} />
          <Route path="report" element={<ReportIssue />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="nearby" element={<NearbyIssues />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          
          {/* 2. Admin Routes */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/profile" element={<Profile />} />

          {/* 3. Department Routes */}
          <Route path="department/dashboard" element={<DepartmentDashboard />} />
          <Route path="department/complaints/:id" element={<DepartmentComplaintDetails />} />
          <Route path="department/heatmap" element={<DepartmentHeatmap />} />
          <Route path="department/prediction" element={<DepartmentPrediction />} />
          <Route path="department/profile" element={<Profile />} />

          {/* 4. Worker Routes */}
          <Route path="worker/dashboard" element={<WorkerDashboard />} />
          <Route path="worker/profile" element={<Profile />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
