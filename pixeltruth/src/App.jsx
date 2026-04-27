import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './components/PublicLayout';
import DashboardLayout from './components/DashboardLayout';
import AdminLayout from './components/AdminLayout';
import { RequireAuth } from './components/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Features from './pages/public/Features';
import Plans from './pages/public/Plans';
import Analyze from './pages/public/Analyze';
import Contact from './pages/public/Contact';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Consumer Dashboard
import Overview from './pages/consumer/Overview';
import UploadAnalyze from './pages/consumer/UploadAnalyze';
import History from './pages/consumer/History';
import ConsumerAlerts from './pages/consumer/ConsumerAlerts';
import YoutubeAnalyze from './pages/consumer/YoutubeAnalyze';
import InstagramAnalyze from './pages/consumer/InstagramAnalyze';

// Admin Dashboard
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUploads from './pages/admin/AdminUploads';
import AdminViolations from './pages/admin/AdminViolations';
import AdminLogs from './pages/admin/AdminLogs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Website */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth (no layout wrapper) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Consumer Dashboard — requires auth, role: consumer */}
          <Route element={<RequireAuth role="consumer" />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Overview />} />
              <Route path="/dashboard/upload" element={<UploadAnalyze />} />
              <Route path="/dashboard/history" element={<History />} />
              <Route path="/dashboard/alerts" element={<ConsumerAlerts />} />
              <Route path="/dashboard/youtube" element={<YoutubeAnalyze />} />
              <Route path="/dashboard/instagram" element={<InstagramAnalyze />} />
            </Route>
          </Route>

          {/* Admin Dashboard — requires auth, role: admin */}
          <Route element={<RequireAuth role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/uploads" element={<AdminUploads />} />
              <Route path="/admin/violations" element={<AdminViolations />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
