import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload, X, Loader, CheckCircle, AlertTriangle, Film,
  Sparkles, ShieldAlert, Tag, Hash, Cpu, FileVideo, Image,
  TrendingUp, Shield, Info
} from 'lucide-react';
import { uploadContent } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';

// ─── Similarity bar with color ────────────────────────────────────────────────
function SimilarityBar({ value }) {
  const color = value >= 85 ? 'bg-red-500' : value >= 60 ? 'bg-yellow-500' : 'bg-green-500';
  const label = value >= 85 ? 'High Risk' : value >= 60 ? 'Suspicious' : 'Safe';
  const labelColor = value >= 85 ? 'text-red-600' : value >= 60 ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Similarity / Risk Score</span>
        <span className={`font-bold ${labelColor}`}>{value}% — {label}</span>
      </div>
      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

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

  // Derive status color
  const statusBg = result?.status === 'High Risk' ? 'border-red-300 bg-red-50'
    : result?.status === 'Suspicious' ? 'border-yellow-300 bg-yellow-50'
    : 'border-green-300 bg-green-50';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload & Analyze</h2>
        <p className="text-sm text-slate-500 mt-1">Upload a video or image to detect unauthorized copies using perceptual hashing + AI.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="drop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
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
                {preview.type.startsWith('video/') ? (
                  <video src={preview.url} className="max-h-64 w-full object-contain" controls />
                ) : (
                  <img src={preview.url} className="max-h-64 object-contain" alt="preview" />
                )}
                <button onClick={reset} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'File Name', value: file.name },
                  { label: 'Size', value: formatSize(file.size) },
                  { label: 'Type', value: file.type || 'Unknown' },
                ].map(({ label, value }) => (
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
                        Extracting fingerprint → scanning database → AI analysis...
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

      {/* ── Result Panel ── */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Status banner */}
            <div className={`rounded-2xl border-2 p-5 flex items-center gap-4 ${statusBg}`}>
              {result.status === 'High Risk'
                ? <AlertTriangle size={28} className="text-red-500 shrink-0" />
                : result.status === 'Suspicious'
                ? <ShieldAlert size={28} className="text-yellow-500 shrink-0" />
                : <CheckCircle size={28} className="text-green-500 shrink-0" />
              }
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-bold text-slate-900 text-base">Analysis Complete</p>
                  <StatusBadge status={result.status} />
                </div>
                <p className="text-sm text-slate-600 mt-1">{result.message}</p>
              </div>
            </div>

            {/* Core stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Content Type"
                value={result.isAiGenerated ? 'AI Generated' : 'Real Content'}
                color={result.isAiGenerated ? 'text-purple-600' : 'text-slate-900'}
              />
              <StatCard
                label="AI Confidence"
                value={`${result.confidence ?? 50}%`}
                sub={result.confidence >= 80 ? 'High certainty' : result.confidence >= 60 ? 'Moderate certainty' : 'Low certainty'}
                color="text-blue-600"
              />
              <StatCard
                label="Frames Extracted"
                value={result.framesExtracted ?? 1}
                sub={result.framesExtracted > 1 ? 'Video frames analyzed' : 'Image analyzed'}
              />
              <StatCard
                label="File Type"
                value={result.fileType ? result.fileType.charAt(0).toUpperCase() + result.fileType.slice(1) : 'Unknown'}
              />
            </div>

            {/* Similarity score bar */}
            {result.matchPercent != null && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <SimilarityBar value={result.matchPercent} />
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Info size={11} />
                  Score based on perceptual hash (dHash + aHash) comparison against {result.matchPercent >= 85 ? 'a known match in the database' : 'all stored fingerprints'}
                </p>
              </div>
            )}

            {/* Fingerprint info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Hash size={14} className="text-slate-400" /> Fingerprint Data
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-slate-500 mb-1">Perceptual Hash (dHash)</p>
                  <code className="text-slate-700 font-mono break-all">{result.perceptualHash || '—'}</code>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-slate-500 mb-1">Method</p>
                  <p className="text-slate-700 font-medium">dHash + aHash + 32-dim feature vector</p>
                  <p className="text-slate-400 mt-0.5">Robust to crop, resize, re-encode</p>
                </div>
              </div>
            </div>

            {/* AI Insights — shown if available, graceful if not */}
            <div className={`rounded-xl border p-5 space-y-3 ${result.aiInsights ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-sm font-semibold flex items-center gap-2 ${result.aiInsights ? 'text-blue-700' : 'text-slate-500'}`}>
                <Sparkles size={14} />
                {result.aiInsights ? 'AI Insights (Gemini)' : 'AI Insights — Not Available'}
              </p>

              {result.aiInsights ? (
                <>
                  {result.aiInsights.contentDescription && (
                    <p className="text-sm text-slate-700">{result.aiInsights.contentDescription}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {result.aiInsights.contentCategory && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full">
                        <Tag size={10} /> {result.aiInsights.contentCategory}
                      </span>
                    )}
                  </div>
                  {result.aiInsights.manipulationSigns?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5 font-medium">Manipulation Signs Detected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.aiInsights.manipulationSigns.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.aiInsights.riskFactors?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5 font-medium">Risk Factors</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.aiInsights.riskFactors.map((r, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500">
                  Gemini API quota exceeded or key not set. Analysis is based on perceptual hashing only.
                  Add a valid <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY</code> in <code className="bg-slate-200 px-1 rounded">.env</code> for full AI analysis.
                </p>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
