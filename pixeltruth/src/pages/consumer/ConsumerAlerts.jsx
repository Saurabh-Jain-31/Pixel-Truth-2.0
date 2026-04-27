import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Bot } from 'lucide-react';
import { getHistory } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';
import AiChat from '../../components/AiChat';

export default function ConsumerAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiQuery, setAiQuery] = useState(null);

  useEffect(() => {
    getHistory()
      .then(({ data }) => {
        // Filter only violations from user's own uploads
        const violations = (data.uploads || []).filter(u =>
          u.status === 'High Risk' || u.status === 'Suspicious'
        );
        setAlerts(violations);
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">My Alerts</h2>
        <p className="text-sm text-slate-500 mt-1">Violations detected in your uploaded content.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-2 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-20 text-center text-slate-400">
          <Bell size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No alerts</p>
          <p className="text-xs mt-1">Your content is clean — no violations detected.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white border rounded-xl p-5 ${
                  alert.status === 'High Risk' ? 'border-red-200' : 'border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    alert.status === 'High Risk' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <AlertTriangle size={16} className={alert.status === 'High Risk' ? 'text-red-500' : 'text-yellow-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{alert.fileName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={alert.status} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                      {alert.matchPercent != null && <span>Match: <strong>{alert.matchPercent}%</strong></span>}
                      {alert.confidence != null && <span>Confidence: <strong>{alert.confidence}%</strong></span>}
                      {alert.isAiGenerated != null && <span>Detection: <strong>{alert.isAiGenerated ? 'AI Generated' : 'Real'}</strong></span>}
                    </div>
                    <button
                      onClick={() => setAiQuery(`My file "${alert.fileName}" was flagged as ${alert.status} with ${alert.matchPercent}% match. What should I do?`)}
                      className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Bot size={12} /> Ask AI what to do
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
      <AiChat initialMessage={aiQuery} onInitialMessageConsumed={() => setAiQuery(null)} />
    </div>
  );
}
