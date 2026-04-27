import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Upload, X, Loader, CheckCircle, AlertTriangle, Film } from 'lucide-react';
import { uploadContent } from '../../api/content';
import StatusBadge from '../../components/StatusBadge';
import MatchBar from '../../components/MatchBar';

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
    setFile(f);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    if (f.type.startsWith('video/') || f.type.startsWith('image/')) {
      setPreview({ url: URL.createObjectURL(f), type: f.type });
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await uploadContent(formData, setUploadProgress);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Is the backend running?';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setUploadProgress(0);
  };

  const formatSize = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload & Analyze</h2>
        <p className="text-sm text-slate-500 mt-1">Upload a video or image to check for unauthorized copies.</p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <p className="text-slate-400 text-sm mt-1">or click to browse — MP4, MOV, AVI, JPG, PNG</p>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Preview */}
            {preview && (
              <div className="relative bg-black aspect-video max-h-64 flex items-center justify-center overflow-hidden">
                {preview.type.startsWith('video/') ? (
                  <video src={preview.url} className="max-h-64 w-full object-contain" controls />
                ) : (
                  <img src={preview.url} className="max-h-64 object-contain" alt="preview" />
                )}
                <button onClick={reset} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="p-6 space-y-5">
              {/* File Info */}
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

              {/* Progress */}
              <AnimatePresence>
                {uploading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Loader size={11} className="animate-spin text-blue-500" /> Uploading & analyzing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-blue-500 rounded-full" animate={{ width: `${uploadProgress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!result ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={uploading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader size={15} className="animate-spin" /> : <Film size={15} />}
                    {uploading ? 'Analyzing...' : 'Analyze Content'}
                  </button>
                ) : null}
                <button onClick={reset} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium">
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <p className="font-semibold text-slate-900">Analysis Complete</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Detection</p>
                <p className="text-lg font-bold text-slate-900">{result.isAiGenerated ? 'AI Generated' : 'Real Content'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <p className="text-lg font-bold text-blue-600">{result.confidence ?? result.matchPercent ?? '—'}%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-2">Risk Level</p>
                <StatusBadge status={result.status} size="lg" />
              </div>
            </div>

            {result.matchPercent != null && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Similarity Score</p>
                <MatchBar value={result.matchPercent} />
              </div>
            )}

            {result.message && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">{result.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
