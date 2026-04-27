import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/uploads': 'All Uploads',
  '/admin/violations': 'Violations',
  '/admin/logs': 'Logs & Reports',
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 border-b border-slate-700/60 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div>
            <p className="text-base font-semibold text-white">{titles[pathname] || 'Admin'}</p>
            <p className="text-xs text-slate-500">Logged in as {user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '13px' }
      }} />
    </div>
  );
}
