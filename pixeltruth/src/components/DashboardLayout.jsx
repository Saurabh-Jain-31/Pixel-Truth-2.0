import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardSidebar from './DashboardSidebar';
import AiChat from './AiChat';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/dashboard': 'Overview',
  '/dashboard/upload': 'Upload & Analyze',
  '/dashboard/youtube':    'YouTube Analyzer',
  '/dashboard/instagram':  'Instagram Analyzer',
  '/dashboard/history': 'Upload History',
  '/dashboard/alerts': 'Alerts',
};

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div>
            <p className="text-base font-semibold text-slate-900">{titles[pathname] || 'Dashboard'}</p>
            <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={17} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '13px' }
      }} />
      <AiChat />
    </div>
  );
}
