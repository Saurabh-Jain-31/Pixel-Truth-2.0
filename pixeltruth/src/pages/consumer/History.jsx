import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Shield, AlertTriangle, CheckCircle, Clock, Hash,
  Download, Flag, ChevronDown, ChevronUp, ExternalLink,
  Lock, Cpu, FileText, Zap, Eye, Copy, RefreshCw, User,
  BarChart2, Link2
} from 'lucide-react';
import { getHistory, requestTakedown, getEvidencePackage, verifyChain } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';

// ─── Blockchain integrity badge ───────────────────────────────────────────────
function ChainBadge({ verified }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${
      verified ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'
    }`}>
      <Lock size={10} /> {verified ? 'Chain Verified' : 'Chain Error'}
    </span>
  );
}

// ─── Content DNA strip ────────────────────────────────────────────────────────
function DnaStrip({ hash }) {
  if (!hash) return null;
  const segments = hash.match(/.{1,4}/g) || [];
  const colors = ['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-cyan-400', 'bg-teal-400', 'bg-violet-400', 'bg-fuchsia-400'];
  return (
    <div className="flex gap-0.5 items-center" title={`Content DNA: ${hash}`}>
      {segments.slice(0, 8).map((seg, i) => {
        const val = parseInt(seg, 16) / 65535;
        return (
          <div key={i} className={`rounded-sm ${colors[i % colors.length]} opacity-70`}
            style={{ width: 6, height: Math.max(4, Math.round(val * 20)) }} />
        );
      })}
    </div>
  );
}

// ─── History item card ────────────────────────────────────────────────────────
function HistoryCard({ item, index, onTakedown, onExport }) {
  const [expanded, setExpanded] = useState(false);
  const [takingDown, setTakingDown] = useState(false);
  const [exporting, setExporting] = useState(false);

  const statusBg = item.status === 'High Risk' ? 'border-red-200'
    : item.status === 'Suspicious' ? 'border-yellow-200'
    : 'border-slate-200';

  const handleTakedown = async () => {
    setTakingDown(true);
    try {
      await onTakedown(item._id);
      toast.success('Takedown request recorded in evidence chain');
    } catch { toast.error('Failed to record takedown'); }
    finally { setTakingDown(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(item._id);
    } catch { toast.error('Failed to export evidence'); }
    finally { setExporting(false); }
  };

  const riskBar = item.matchPercent != null ? (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${item.matchPercent >= 85 ? 'bg-red-500' : item.matchPercent >= 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${item.matchPercent}%` }} />
      </div>
      <span className="text-xs text-slate-500 font-medium">{item.matchPercent}%</span>
    </div>
  ) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white border rounded-2xl overflow-hidden ${statusBg}`}>

      {/* Main row */}
      <div className="p-4 flex gap-4 items-start">
        {/* Status icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          item.status === 'High Risk' ? 'bg-red-100' : item.status === 'Suspicious' ? 'bg-yellow-100' : 'bg-green-100'
        }`}>
          {item.status === 'High Risk' ? <AlertTriangle size={18} className="text-red-500" />
            : item.status === 'Suspicious' ? <Shield size={18} className="text-yellow-500" />
            : <CheckCircle size={18} className="text-green-500" />}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900 text-sm truncate max-w-[280px]">{item.originalName || item.fileName}</p>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Clock size={10} /> {new Date(item.createdAt).toLocaleString()}
                {item.fileType && <span className="capitalize">· {item.fileType}</span>}
                {item.fileSize && <span>· {(item.fileSize / 1024).toFixed(0)} KB</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <StatusBadge status={item.status} />
              {item.takedownStatus && item.takedownStatus !== 'none' && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200 font-medium flex items-center gap-1">
                  <Flag size={9} /> Takedown {item.takedownStatus}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {riskBar}
            <DnaStrip hash={item.perceptualHash} />
            {item.evidenceBlockId && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Lock size={9} className="text-green-500" /> Evidence sealed
              </span>
            )}
            {item.platformMatches?.length > 0 && (
              <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                <Link2 size={9} /> {item.platformMatches.length} platform match{item.platformMatches.length > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>

        <button onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50">

              {/* Analysis message */}
              {item.message && (
                <p className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-200">{item.message}</p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Detection', value: item.isAiGenerated ? 'AI Generated' : 'Real Content', icon: Cpu },
                  { label: 'Confidence', value: item.confidence != null ? `${item.confidence}%` : '—', icon: BarChart2 },
                  { label: 'Frames', value: item.framesExtracted ?? 1, icon: Eye },
                  { label: 'AI Insights', value: item.aiInsights ? item.aiInsights.contentCategory || 'Available' : 'N/A', icon: Zap },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                    <Icon size={12} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
                  </div>
                ))}
              </div>

              {/* Content DNA */}
              {item.perceptualHash && (
                <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"><Hash size={11} /> Content DNA Fingerprint</p>
                  <div className="flex items-center gap-3">
                    <DnaStrip hash={item.perceptualHash} />
                    <code className="text-xs text-slate-400 font-mono truncate flex-1">{item.perceptualHash}</code>
                    <button onClick={() => { navigator.clipboard.writeText(item.perceptualHash); toast.success('Hash copied'); }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors">
                      <Copy size={12} />
                    </button>
                  </div>
                  {item.fileHash && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">SHA-256:</span>
                      <code className="text-xs text-slate-400 font-mono truncate flex-1">{item.fileHash.slice(0, 32)}...</code>
                    </div>
                  )}
                </div>
              )}

              {/* Platform matches */}
              {item.platformMatches?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-600 px-3 py-2 border-b border-slate-100 flex items-center gap-1.5">
                    <Link2 size={11} /> Found on Platforms
                  </p>
                  <div className="divide-y divide-slate-100">
                    {item.platformMatches.slice(0, 4).map((m, i) => (
                      <div key={i} className="px-3 py-2 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{m.title}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <User size={9} /> {m.channel}
                            {m.uploadedAt && <span>· {new Date(m.uploadedAt).toLocaleDateString()}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold ${m.similarity >= 65 ? 'text-red-600' : m.similarity >= 35 ? 'text-yellow-600' : 'text-slate-500'}`}>
                            {m.similarity}%
                          </span>
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 transition-colors">
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {item.aiInsights && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><Zap size={11} /> AI Insights</p>
                  {item.aiInsights.contentDescription && <p className="text-xs text-slate-700">{item.aiInsights.contentDescription}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {item.aiInsights.manipulationSigns?.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">{s}</span>
                    ))}
                    {item.aiInsights.riskFactors?.map((r, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={handleExport} disabled={exporting}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-60">
                  {exporting ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
                  Export Evidence Package
                </button>
                {(item.status === 'High Risk' || item.status === 'Suspicious') && item.takedownStatus === 'none' && (
                  <button onClick={handleTakedown} disabled={takingDown}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60">
                    {takingDown ? <RefreshCw size={11} className="animate-spin" /> : <Flag size={11} />}
                    Request Takedown
                  </button>
                )}
                {item.takedownStatus === 'pending' && (
                  <a href="https://support.google.com/youtube/answer/2807622" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors">
                    <ExternalLink size={11} /> File DMCA Now
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Evidence modal ───────────────────────────────────────────────────────────
function EvidenceModal({ pkg, onClose }) {
  if (!pkg) return null;
  const ep = pkg.evidencePackage;

  const copyAll = () => {
    const text = JSON.stringify(ep, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Evidence package copied to clipboard');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <p className="font-bold flex items-center gap-2"><Lock size={15} /> Legal Evidence Package</p>
            <p className="text-xs text-slate-400 mt-0.5">Case ID: {ep.caseId} · Generated: {new Date(ep.generatedAt).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <ChainBadge verified={ep.chainIntegrity?.valid} />
            <button onClick={copyAll} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              <Copy size={11} /> Copy JSON
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {/* File info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><FileText size={11} /> File Evidence</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-800">{ep.file.name}</span></div>
              <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-800 capitalize">{ep.file.type}</span></div>
              <div><span className="text-slate-500">Uploaded:</span> <span className="font-medium text-slate-800">{new Date(ep.file.uploadedAt).toLocaleString()}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-800">{ep.analysis.status}</span></div>
            </div>
            {ep.file.sha256 && (
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">SHA-256 File Hash (tamper-proof)</p>
                <code className="text-xs font-mono text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200 block">{ep.file.sha256}</code>
              </div>
            )}
          </div>

          {/* Chain of custody */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"><Lock size={11} /> Blockchain Chain of Custody ({ep.chainOfCustody.length} blocks)</p>
            <div className="space-y-2">
              {ep.chainOfCustody.map((block, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">{block.blockIndex}</span>
                      {block.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(block.timestamp).toLocaleString()}</span>
                  </div>
                  <code className="text-xs font-mono text-slate-400 break-all">{block.blockHash}</code>
                  {block.payloadSummary && <p className="text-xs text-slate-500 italic">{block.payloadSummary}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Legal note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-700 leading-relaxed">{ep.legalNote}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main History page ────────────────────────────────────────────────────────
export default function History() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [chainStatus, setChainStatus] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState(null);

  useEffect(() => {
    getHistory()
      .then(({ data }) => setUploads(data.uploads || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load history'))
      .finally(() => setLoading(false));

    verifyChain()
      .then(({ data }) => setChainStatus(data))
      .catch(() => {});
  }, []);

  const handleTakedown = async (id) => {
    await requestTakedown(id, 'Takedown requested via PixelTruth dashboard', '');
    setUploads(prev => prev.map(u => u._id === id ? { ...u, takedownStatus: 'pending' } : u));
  };

  const handleExport = async (id) => {
    const { data } = await getEvidencePackage(id);
    setEvidenceModal(data);
  };

  const statuses = ['All', 'Safe', 'Suspicious', 'High Risk'];
  const filtered = uploads.filter(u => {
    const matchSearch = (u.originalName || u.fileName)?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || u.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: uploads.length,
    violations: uploads.filter(u => u.status === 'High Risk' || u.status === 'Suspicious').length,
    takedowns: uploads.filter(u => u.takedownStatus && u.takedownStatus !== 'none').length,
    withMatches: uploads.filter(u => u.platformMatches?.length > 0).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Evidence Vault</h2>
          <p className="text-sm text-slate-500 mt-1">Blockchain-secured analysis history with legal chain of custody.</p>
        </div>
        {chainStatus && <ChainBadge verified={chainStatus.valid} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Analyzed', value: stats.total, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Violations', value: stats.violations, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Takedowns Filed', value: stats.takedowns, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Platform Matches', value: stats.withMatches, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border border-slate-200 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by file name..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
          <Lock size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">{uploads.length === 0 ? 'No uploads yet.' : 'No results match your filter.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <HistoryCard key={item._id} item={item} index={i}
              onTakedown={handleTakedown} onExport={handleExport} />
          ))}
        </div>
      )}

      {/* Evidence modal */}
      <AnimatePresence>
        {evidenceModal && <EvidenceModal pkg={evidenceModal} onClose={() => setEvidenceModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
