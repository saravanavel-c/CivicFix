import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import ComplaintsList from './pages/ComplaintsList';
import ComplaintDetail from './pages/ComplaintDetail';
import NearbyIssues from './pages/NearbyIssues';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect base to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Client Pages */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="report" element={<ReportIssue />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="nearby" element={<NearbyIssues />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
