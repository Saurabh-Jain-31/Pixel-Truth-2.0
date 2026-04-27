import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { getHistory } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';
import MatchBar from '../../components/MatchBar';
import SkeletonCard from '../../components/SkeletonCard';
import SkeletonRow from '../../components/SkeletonRow';

export default function Overview() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getHistory()
      .then(({ data }) => setHistory(data.uploads || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: history.length,
    safe: history.filter(h => h.status === 'Safe').length,
    violations: history.filter(h => h.status === 'High Risk').length,
    pending: history.filter(h => h.status === 'Processing' || h.status === 'Pending').length,
  };

  const statCards = [
    { label: 'Total Uploads', value: stats.total, icon: Upload, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Safe Content', value: stats.safe, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { label: 'Violations', value: stats.violations, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { label: 'Processing', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  ];

  const recent = history.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white border rounded-xl p-5 ${bg}`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                <div className={`p-1.5 rounded-lg ${bg} border`}>
                  <Icon size={14} className={color} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </motion.div>
          ))
        }
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error} — Make sure the backend is running.
        </div>
      )}

      {/* Recent Uploads */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Recent Uploads</p>
          <Link to="/dashboard/history" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <table className="w-full"><tbody>{Array(4).fill(0).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
        ) : recent.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Upload size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No uploads yet.</p>
            <Link to="/dashboard/upload" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Upload your first file →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {['File Name', 'Type', 'Match %', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((item, i) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3 text-slate-800 font-medium max-w-[180px] truncate">{item.fileName}</td>
                    <td className="px-5 py-3 text-slate-500 capitalize">{item.fileType}</td>
                    <td className="px-5 py-3 w-36">
                      {item.matchPercent != null ? <MatchBar value={item.matchPercent} /> : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-3 text-slate-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
