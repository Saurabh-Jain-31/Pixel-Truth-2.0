import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Search } from 'lucide-react';
import { getHistory } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';
import MatchBar from '../../components/MatchBar';
import SkeletonRow from '../../components/SkeletonRow';

export default function History() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getHistory()
      .then(({ data }) => setUploads(data.uploads || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const statuses = ['All', 'Safe', 'Suspicious', 'High Risk', 'Processing'];

  const filtered = uploads.filter(u => {
    const matchSearch = u.fileName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload History</h2>
        <p className="text-sm text-slate-500 mt-1">All your analyzed content from the database.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by file name..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['File Name', 'Type', 'Detection', 'Confidence', 'Match %', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} cols={7} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <HistoryIcon size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{uploads.length === 0 ? 'No uploads yet.' : 'No results match your filter.'}</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((item, i) => (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-800 max-w-[160px] truncate">{item.fileName}</td>
                      <td className="px-5 py-3 text-slate-500 capitalize">{item.fileType}</td>
                      <td className="px-5 py-3 text-slate-700">{item.isAiGenerated != null ? (item.isAiGenerated ? 'AI Generated' : 'Real') : '—'}</td>
                      <td className="px-5 py-3 text-slate-700">{item.confidence != null ? `${item.confidence}%` : '—'}</td>
                      <td className="px-5 py-3 w-32">{item.matchPercent != null ? <MatchBar value={item.matchPercent} /> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
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
