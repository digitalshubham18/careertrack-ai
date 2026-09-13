import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const JobListings = lazy(() => import('./pages/JobListings'));
const JobDetails = lazy(() => import('./pages/JobDetails'));
const Applications = lazy(() => import('./pages/Applications'));
const ApplicationDetails = lazy(() => import('./pages/ApplicationDetails'));
const ResumeManager = lazy(() => import('./pages/ResumeManager'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const AtsAnalyzer = lazy(() => import('./pages/AtsAnalyzer'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const DsaTracker = lazy(() => import('./pages/DsaTracker'));
const CompanyTracker = lazy(() => import('./pages/CompanyTracker'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminJobSources = lazy(() => import('./pages/AdminJobSources'));
const AdminJobListings = lazy(() => import('./pages/AdminJobListings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route path="/resumes" element={<ResumeManager />} />
          <Route path="/resume-builder/:id" element={<ResumeBuilder />} />
          <Route path="/ats-analyzer" element={<AtsAnalyzer />} />
          <Route path="/interview-prep" element={<InterviewPrep />} />
          <Route path="/dsa-tracker" element={<DsaTracker />} />
          <Route path="/companies" element={<CompanyTracker />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/job-sources"
            element={
              <AdminRoute>
                <AdminJobSources />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/job-listings"
            element={
              <AdminRoute>
                <AdminJobListings />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
