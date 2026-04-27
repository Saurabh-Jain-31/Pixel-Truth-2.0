import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, FileVideo, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getDashboardStats } from '../../api/admin';
import SkeletonCard from '../../components/SkeletonCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Users', value: stats.totalUsers ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { label: 'Total Uploads', value: stats.totalUploads ?? 0, icon: FileVideo, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { label: 'Violations', value: stats.violations ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    { label: 'Safe Content', value: stats.safeContent ?? 0, icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} dark />)
          : cards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-slate-800/60 border rounded-xl p-5 ${bg}`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                <div className={`p-1.5 rounded-lg ${bg} border`}>
                  <Icon size={14} className={color} />
                </div>
              </div>
              <p className={`text-3xl font-bold font-mono ${color}`}>{value.toLocaleString()}</p>
            </motion.div>
          ))
        }
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
        <p className="text-slate-300 font-semibold mb-2">Admin Panel</p>
        <p className="text-slate-500 text-sm">Use the sidebar to navigate to Users, Uploads, Violations, and Logs.</p>
      </div>
    </div>
  );
}
