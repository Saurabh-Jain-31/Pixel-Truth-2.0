import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileVideo, Search } from 'lucide-react';
import { getAllUploads } from '../../api/admin';
import StatusBadge from '../../components/StatusBadge';
import MatchBar from '../../components/MatchBar';
import SkeletonRow from '../../components/SkeletonRow';

export default function AdminUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getAllUploads()
      .then(({ data }) => setUploads(data.uploads || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load uploads'))
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['All', 'Safe', 'Suspicious', 'High Risk', 'Processing'];

  const filtered = uploads.filter(u => {
    const matchSearch = u.fileName?.toLowerCase().includes(search.toLowerCase()) ||
      u.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All Uploads</h2>
          <p className="text-sm text-slate-400 mt-1">{uploads.length} total uploads</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['File Name', 'User', 'Type', 'Match %', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} dark />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500">
                        <FileVideo size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No uploads found</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((item, i) => (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-200 font-medium max-w-[160px] truncate">{item.fileName}</td>
                      <td className="px-5 py-3 text-slate-400">{item.user?.name || item.user?.email || '—'}</td>
                      <td className="px-5 py-3 text-slate-400 capitalize">{item.fileType}</td>
                      <td className="px-5 py-3 w-32">{item.matchPercent != null ? <MatchBar value={item.matchPercent} /> : <span className="text-slate-500">—</span>}</td>
                      <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
