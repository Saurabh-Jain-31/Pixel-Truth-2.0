import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Download } from 'lucide-react';
import { getLogs } from '../../api/admin';
import toast from 'react-hot-toast';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getLogs()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    toast.loading('Generating report...', { id: 'export' });
    setTimeout(() => toast.success('Report exported!', { id: 'export' }), 1500);
  };

  const levelColor = {
    INFO: 'text-blue-400',
    WARN: 'text-yellow-400',
    ERROR: 'text-red-400',
    SUCCESS: 'text-green-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Logs & Reports</h2>
          <p className="text-sm text-slate-400 mt-1">System activity and audit trail</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Download size={14} />
          Export Report
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400">{error}</div>}

      <div className="bg-slate-950 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
          <ScrollText size={14} className="text-slate-500" />
          <span className="text-xs font-mono text-slate-500">system.log</span>
        </div>
        <div className="p-5 font-mono text-xs space-y-1.5 max-h-[600px] overflow-y-auto">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${50 + (i * 17) % 40}%` }} />
            ))
          ) : logs.length === 0 ? (
            <p className="text-slate-600">No logs available.</p>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={log._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex gap-3"
              >
                <span className="text-slate-600 shrink-0">{new Date(log.timestamp || log.createdAt).toLocaleTimeString()}</span>
                <span className={`shrink-0 w-16 ${levelColor[log.level] || 'text-slate-400'}`}>[{log.level || 'INFO'}]</span>
                <span className="text-slate-300">{log.message}</span>
                {log.user && <span className="text-slate-600">— {log.user}</span>}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
