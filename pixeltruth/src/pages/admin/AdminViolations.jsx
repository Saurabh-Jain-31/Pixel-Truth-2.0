import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { getViolations } from '../../api/admin';
import StatusBadge from '../../components/StatusBadge';
import MatchBar from '../../components/MatchBar';
import SkeletonRow from '../../components/SkeletonRow';

export default function AdminViolations() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getViolations()
      .then(({ data }) => setViolations(data.violations || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load violations'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Violations</h2>
        <p className="text-sm text-slate-400 mt-1">{violations.length} violations detected across all users</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : violations.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl py-20 text-center text-slate-500">
          <AlertTriangle size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No violations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v, i) => (
            <motion.div
              key={v._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-slate-800/60 border rounded-xl p-5 ${
                v.status === 'High Risk' ? 'border-red-500/30' : 'border-yellow-500/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  v.status === 'High Risk' ? 'bg-red-500/15 border border-red-500/30' : 'bg-yellow-500/15 border border-yellow-500/30'
                }`}>
                  <AlertTriangle size={16} className={v.status === 'High Risk' ? 'text-red-400' : 'text-yellow-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-white text-sm">{v.fileName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        User: {v.user?.name || v.user?.email || 'Unknown'} · {new Date(v.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  {v.matchPercent != null && (
                    <div className="mt-3 w-48">
                      <p className="text-xs text-slate-500 mb-1">Match Score</p>
                      <MatchBar value={v.matchPercent} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
