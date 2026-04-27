import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload, X, Loader, CheckCircle, AlertTriangle, Film,
  Sparkles, ShieldAlert, Tag, Hash, Info, ExternalLink,
  Gavel, Camera, Mail, Eye, Shield, Bell, User, Calendar,
  ChevronDown, ChevronUp, Flag
} from 'lucide-react';
import { uploadContent } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';

// ─── Similarity bar ───────────────────────────────────────────────────────────
function SimilarityBar({ value }) {
  const color = value >= 85 ? 'bg-red-500' : value >= 60 ? 'bg-yellow-500' : 'bg-green-500';
  const label = value >= 85 ? 'High Risk' : value >= 60 ? 'Suspicious' : 'Safe';
  const labelColor = value >= 85 ? 'text-red-600' : value >= 60 ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Overall Risk Score</span>
        <span className={`font-bold ${labelColor}`}>{value}% — {label}</span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

// ─── Platform match card ──────────────────────────────────────────────────────
function PlatformMatchCard({ match, index }) {
  const [open, setOpen] = useState(false);
  const riskColor = match.riskLevel === 'High Risk' ? 'border-red-200 bg-red-50'
    : match.riskLevel === 'Suspicious' ? 'border-yellow-200 bg-yellow-50'
    : 'border-slate-200 bg-white';
  const simColor = match.similarity >= 70 ? 'bg-red-500' : match.similarity >= 40 ? 'bg-yellow-500' : 'bg-blue-400';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border overflow-hidden ${riskColor}`}>
      <div className="p-4 flex gap-3 items-start">
        {match.thumbnail && (
          <img src={match.thumbnail} alt="" className="w-28 shrink-0 rounded-lg border border-slate-200 object-cover" style={{ height: 64 }} />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <a href={match.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 leading-snug transition-colors">
              {match.title} <ExternalLink size={11} className="shrink-0 opacity-60" />
            </a>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
              match.riskLevel === 'High Risk' ? 'bg-red-100 text-red-700 border-red-200'
              : match.riskLevel === 'Suspicious' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
              : 'bg-green-100 text-green-700 border-green-200'
            }`}>{match.riskLevel}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <User size={10} /> {match.channel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {match.uploadedAt ? new Date(match.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </span>
            {match.daysSinceUpload != null && (
              <span className="text-slate-400">{match.daysSinceUpload} days ago</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 w-32 bg-slate-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${match.similarity}%` }}
                transition={{ duration: 0.6, delay: index * 0.06 }}
                className={`h-full rounded-full ${simColor}`} />
            </div>
            <span className="text-xs font-bold text-slate-600">{match.similarity}% visual match</span>
          </div>
        </div>

        <button onClick={() => setOpen(o => !o)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-200 bg-white p-4 space-y-3">
              {match.description && (
                <p className="text-xs text-slate-500 italic">"{match.description}"</p>
              )}
              <div className="flex flex-wrap gap-2">
                <a href={match.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors">
                  <Eye size={11} /> Watch on {match.platform}
                </a>
                {match.platform === 'YouTube' && (
                  <a href="https://support.google.com/youtube/answer/2807622" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                    <Flag size={11} /> File DMCA Takedown
                  </a>
                )}
                <a href={`https://www.youtube.com/copyright_complaint_form?video_id=${match.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                  <Gavel size={11} /> Copyright Complaint
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Action step card ─────────────────────────────────────────────────────────
const actionIcons = { gavel: Gavel, camera: Camera, mail: Mail, eye: Eye, shield: Shield, bell: Bell };
const priorityStyle = {
  high:   { dot: 'bg-red-500',    label: 'Urgent',  text: 'text-red-600' },
  medium: { dot: 'bg-yellow-500', label: 'Recommended', text: 'text-yellow-600' },
  low:    { dot: 'bg-green-500',  label: 'Optional', text: 'text-green-600' },
};

function ActionCard({ step, index }) {
  const Icon = actionIcons[step.icon] || Shield;
  const ps = priorityStyle[step.priority] || priorityStyle.low;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex gap-3 items-start p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all bg-white">
      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Icon size={13} className="text-slate-500" /> {step.title}
          </p>
          <span className={`text-xs font-medium flex items-center gap-1 ${ps.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} /> {ps.label}
          </span>
        </div>
        <p className="text-xs text-slate-500">{step.desc}</p>
        {step.link && (
          <a href={step.link} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1.5 font-medium">
            <ExternalLink size={10} /> {step.linkText}
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UploadAnalyze() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null); setError(null); setUploadProgress(0);
    if (f.type.startsWith('video/') || f.type.startsWith('image/'))
      setPreview({ url: URL.createObjectURL(f), type: f.type });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(true); setError(null); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await uploadContent(formData, setUploadProgress);
      setResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Is the backend running?';
      setError(msg); toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); setUploadProgress(0); };
  const formatSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

  const statusBg = result?.status === 'High Risk' ? 'border-red-300 bg-red-50'
    : result?.status === 'Suspicious' ? 'border-yellow-300 bg-yellow-50'
    : 'border-green-300 bg-green-50';

  const platformCount = result?.platformMatches?.length ?? 0;
  const highMatches = result?.platformMatches?.filter(m => m.similarity >= 50).length ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload & Analyze</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload your image or video — we'll fingerprint it, scan YouTube for copies, show you where it appears, and tell you what to do.
        </p>
      </div>

      {/* Drop zone */}
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}>
            <input ref={inputRef} type="file" accept="video/*,image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <motion.div animate={{ y: dragging ? -6 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Upload size={40} className={`mb-4 ${dragging ? 'text-blue-500' : 'text-slate-400'}`} />
            </motion.div>
            <p className="text-slate-700 font-medium">{dragging ? 'Drop it here' : 'Drag & drop your file'}</p>
            <p className="text-slate-400 text-sm mt-1">MP4, MOV, AVI, JPG, PNG · up to 500MB</p>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {preview && (
              <div className="relative bg-black max-h-64 flex items-center justify-center overflow-hidden">
                {preview.type.startsWith('video/')
                  ? <video src={preview.url} className="max-h-64 w-full object-contain" controls />
                  : <img src={preview.url} className="max-h-64 object-contain" alt="preview" />}
                <button onClick={reset} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[{ label: 'File Name', value: file.name }, { label: 'Size', value: formatSize(file.size) }, { label: 'Type', value: file.type || 'Unknown' }]
                  .map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className="text-sm text-slate-800 font-medium truncate">{value}</p>
                    </div>
                  ))}
              </div>

              <AnimatePresence>
                {uploading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Loader size={11} className="animate-spin text-blue-500" />
                        Fingerprinting → DB scan → AI analysis → searching YouTube...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-blue-500 rounded-full" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                {!result && (
                  <button onClick={handleAnalyze} disabled={uploading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    {uploading ? <Loader size={15} className="animate-spin" /> : <Film size={15} />}
                    {uploading ? 'Analyzing...' : 'Analyze Content'}
                  </button>
                )}
                <button onClick={reset} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Status banner */}
            <div className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${statusBg}`}>
              {result.status === 'High Risk' ? <AlertTriangle size={28} className="text-red-500 shrink-0" />
                : result.status === 'Suspicious' ? <ShieldAlert size={28} className="text-yellow-500 shrink-0" />
                : <CheckCircle size={28} className="text-green-500 shrink-0" />}
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-bold text-slate-900">Analysis Complete</p>
                  <StatusBadge status={result.status} />
                </div>
                <p className="text-sm text-slate-600 mt-1">{result.message}</p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Content Type', value: result.isAiGenerated ? 'AI Generated' : 'Real Content', color: result.isAiGenerated ? 'text-purple-600' : 'text-slate-900' },
                { label: 'Risk Score', value: `${result.matchPercent ?? 0}%`, color: result.matchPercent >= 85 ? 'text-red-600' : result.matchPercent >= 60 ? 'text-yellow-600' : 'text-green-600' },
                { label: 'Found on Platforms', value: platformCount, color: platformCount > 0 ? 'text-orange-600' : 'text-green-600' },
                { label: 'High Similarity', value: highMatches, color: highMatches > 0 ? 'text-red-600' : 'text-green-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Risk bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <SimilarityBar value={result.matchPercent ?? 0} />
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Info size={11} /> Based on perceptual hash (dHash + aHash) + AI analysis
              </p>
            </div>

            {/* ── Found on these platforms ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <ShieldAlert size={15} className="text-slate-500" />
                <p className="font-semibold text-slate-900 text-sm">Found on These Platforms</p>
                <span className="ml-auto text-xs text-slate-400">{platformCount} result{platformCount !== 1 ? 's' : ''}</span>
              </div>

              {platformCount === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
                  <p className="text-sm font-semibold text-slate-700">Not found on any platform</p>
                  <p className="text-xs text-slate-400 mt-1">No matching content detected on YouTube.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {result.platformMatches.map((match, i) => (
                    <PlatformMatchCard key={match.id || i} match={match} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* ── What to do ── */}
            {result.actionSteps?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                  <Gavel size={15} className="text-slate-600" />
                  <p className="font-semibold text-slate-900 text-sm">What You Should Do</p>
                </div>
                <div className="p-4 space-y-2">
                  {result.actionSteps.map((step, i) => (
                    <ActionCard key={i} step={step} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {result.aiInsights && (
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 space-y-3">
                <p className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <Sparkles size={14} /> AI Content Insights
                </p>
                {result.aiInsights.contentDescription && (
                  <p className="text-sm text-slate-700">{result.aiInsights.contentDescription}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {result.aiInsights.contentCategory && (
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full flex items-center gap-1">
                      <Tag size={10} /> {result.aiInsights.contentCategory}
                    </span>
                  )}
                  {result.aiInsights.contentTopic && (
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                      {result.aiInsights.contentTopic}
                    </span>
                  )}
                </div>
                {result.aiInsights.searchKeywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.aiInsights.searchKeywords.map((k, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-white text-slate-600 border border-slate-200 rounded-full">{k}</span>
                    ))}
                  </div>
                )}
                {result.aiInsights.manipulationSigns?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5 font-medium">Manipulation Signs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.aiInsights.manipulationSigns.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fingerprint */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" /> Fingerprint
              </p>
              <code className="text-xs text-slate-500 font-mono break-all">{result.perceptualHash || '—'}</code>
              <p className="text-xs text-slate-400">dHash + aHash + 32-dim feature vector · robust to crop, resize, re-encode</p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
