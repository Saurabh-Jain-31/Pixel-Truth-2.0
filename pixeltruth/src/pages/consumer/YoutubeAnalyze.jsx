import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Video, Search, Loader, AlertTriangle, CheckCircle, ExternalLink,
  Sparkles, ShieldAlert, Eye, Scale, Gavel, FileWarning,
  TrendingUp, Tag, Info, ChevronDown, ChevronUp, User, Calendar, Flag
} from 'lucide-react';
import { analyzeYouTubeUrl } from '../../api/youtube';
import StatusBadge from '../../components/StatusBadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const riskBorder = { 'High Risk': 'border-red-200 bg-red-50', 'Suspicious': 'border-yellow-200 bg-yellow-50', 'Low': 'border-slate-100 bg-white' };
const riskPill   = { 'High Risk': 'bg-red-100 text-red-700 border-red-200', 'Suspicious': 'bg-yellow-100 text-yellow-700 border-yellow-200', 'Low': 'bg-green-100 text-green-700 border-green-200' };
const verdictStyle = {
  'Likely Violation':   { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    icon: <Gavel size={13} /> },
  'Possible Violation': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: <FileWarning size={13} /> },
  'Probably Safe':      { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  icon: <CheckCircle size={13} /> },
  'Cannot Determine':   { bg: 'bg-slate-50 border-slate-200',  text: 'text-slate-600',  icon: <Info size={13} /> },
};
const actionColor = {
  'File DMCA Takedown':    'bg-red-600 hover:bg-red-700 text-white',
  'Send Copyright Strike': 'bg-orange-500 hover:bg-orange-600 text-white',
  'Monitor Closely':       'bg-yellow-500 hover:bg-yellow-600 text-white',
  'No Action Needed':      'bg-green-600 hover:bg-green-700 text-white',
  'Seek Legal Advice':     'bg-purple-600 hover:bg-purple-700 text-white',
};
const copyrightVerdictStyle = {
  'Likely Original':       { bg: 'bg-green-50 border-green-200',  text: 'text-green-700' },
  'Possibly Copyrighted':  { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  'Likely Copyrighted':    { bg: 'bg-red-50 border-red-200',      text: 'text-red-700' },
  'Unknown':               { bg: 'bg-slate-50 border-slate-200',   text: 'text-slate-600' },
};

function SimilarVideoCard({ video, index }) {
  const [expanded, setExpanded] = useState(false);
  const ca = video.copyrightAssessment;
  const vs = ca?.verdict ? verdictStyle[ca.verdict] || verdictStyle['Cannot Determine'] : null;
  const diff = video.differences;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border overflow-hidden ${riskBorder[video.riskLevel]}`}
    >
      {/* ── Main row ── */}
      <div className="p-4 flex gap-3 items-start">
        {video.thumbnail && (
          <img src={video.thumbnail} alt="" className="w-32 h-18 object-cover rounded-lg shrink-0 border border-slate-200" style={{ height: 72 }} />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title + risk badge */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <a href={video.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 transition-colors leading-snug">
              {video.title}
              <ExternalLink size={11} className="shrink-0 opacity-60" />
            </a>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${riskPill[video.riskLevel]}`}>
              {video.riskLevel}
            </span>
          </div>

          {/* Channel + date */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <User size={11} /> {video.channel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Similarity bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[160px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${video.similarity}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={`h-full rounded-full ${video.similarity >= 90 ? 'bg-red-500' : video.similarity >= 70 ? 'bg-yellow-500' : 'bg-blue-400'}`}
              />
            </div>
            <span className="text-xs font-bold text-slate-600">{video.similarity}% similar</span>
          </div>

          {/* Copyright verdict */}
          {ca && vs && (
            <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border font-medium ${vs.bg} ${vs.text}`}>
              {vs.icon} {ca.verdict}
              {ca.confidence != null && <span className="opacity-60">· {ca.confidence}%</span>}
            </div>
          )}
        </div>

        <button onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 shrink-0 mt-1 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* ── Expanded details ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-200 bg-white p-4 space-y-4">

              {/* Similar vs Different */}
              {diff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* What IS similar */}
                  {diff.similar?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-yellow-700 flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={11} /> What's Similar
                      </p>
                      {diff.similar.map((s, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-yellow-800">
                          <span className="mt-0.5 shrink-0">•</span> {s}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* What is NOT similar */}
                  {diff.different?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5 mb-2">
                        <CheckCircle size={11} /> What's Different
                      </p>
                      {diff.different.map((d, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-green-800">
                          <span className="mt-0.5 shrink-0">•</span> {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Copyright reason */}
              {ca?.reason && (
                <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <Scale size={13} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-600">{ca.reason}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Suggested action from AI */}
                {ca?.suggestedAction && ca.suggestedAction !== 'No Action Needed' && (
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold ${actionColor[ca.suggestedAction] || 'bg-slate-600 text-white'}`}>
                    <Gavel size={11} /> {ca.suggestedAction}
                  </span>
                )}

                {/* File Copyright Complaint on YouTube */}
                <a
                  href={video.copyrightComplaintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <Flag size={11} /> File Copyright Complaint
                </a>

                {/* DMCA info */}
                <a
                  href="https://support.google.com/youtube/answer/2807622"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-slate-700 hover:bg-slate-800 text-white transition-colors"
                >
                  <ExternalLink size={11} /> DMCA Guide
                </a>

                {/* Watch video */}
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Eye size={11} /> Watch Video
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function YoutubeAnalyze() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!url.trim()) { toast.error('Paste a YouTube URL first'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await analyzeYouTubeUrl(url.trim());
      setResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed. Check your YouTube API key.';
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Video size={20} className="text-red-500" /> YouTube Copyright Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste a YouTube URL — we'll find similar videos, detect duplicates, and tell you if it's a copyright violation.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 transition-all bg-slate-50">
            <Video size={16} className="text-red-500 shrink-0" />
            <input
              type="url" value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <button onClick={handleAnalyze} disabled={loading || !url.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0">
            {loading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
            <Loader size={11} className="animate-spin text-blue-500" />
            Fetching metadata → scanning YouTube → running AI copyright analysis...
          </div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Source Video */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Eye size={14} className="text-blue-500" />
                <p className="font-semibold text-slate-900 text-sm">Source Video</p>
                <div className="ml-auto"><StatusBadge status={result.summary.overallStatus} /></div>
              </div>
              <div className="p-5 flex gap-4">
                {result.source.thumbnail && (
                  <img src={result.source.thumbnail} alt="thumbnail"
                    className="w-44 h-26 object-cover rounded-xl shrink-0 border border-slate-200" style={{ height: 96 }} />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <a href={result.source.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-slate-900 hover:text-blue-600 flex items-start gap-1.5 transition-colors text-sm leading-snug">
                    {result.source.title} <ExternalLink size={12} className="mt-0.5 shrink-0" />
                  </a>
                  <p className="text-xs text-slate-500">{result.source.channel} · {new Date(result.source.publishedAt).toLocaleDateString()}</p>
                  {result.source.viewCount && (
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <TrendingUp size={11} /> {parseInt(result.source.viewCount).toLocaleString()} views
                    </p>
                  )}
                  {/* Source copyright verdict */}
                  {result.geminiInsights?.copyrightVerdict && (() => {
                    const s = copyrightVerdictStyle[result.geminiInsights.copyrightVerdict] || copyrightVerdictStyle['Unknown'];
                    return (
                      <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${s.bg} ${s.text}`}>
                        <Scale size={11} /> {result.geminiInsights.copyrightVerdict}
                        {result.geminiInsights.licenseType && result.geminiInsights.licenseType !== 'Unknown' && (
                          <span className="opacity-70">· {result.geminiInsights.licenseType}</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* AI Copyright Analysis */}
            {result.geminiInsights && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                  <Sparkles size={14} /> AI Copyright Analysis
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Content Type', value: result.geminiInsights.contentType },
                    { label: 'Main Subject', value: result.geminiInsights.mainSubject },
                    { label: 'AI Generated', value: result.geminiInsights.isAiGenerated ? 'Yes' : 'No' },
                    { label: 'Risk Level', value: result.geminiInsights.riskLevel || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
                    </div>
                  ))}
                </div>

                {result.geminiInsights.copyrightReason && (
                  <div className="flex items-start gap-2 bg-white rounded-xl p-3 border border-blue-100">
                    <Scale size={13} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700">{result.geminiInsights.copyrightReason}</p>
                  </div>
                )}

                {/* Suggested actions for source video */}
                {result.geminiInsights.suggestedActions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <Gavel size={11} /> Suggested Actions for Your Content
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.geminiInsights.suggestedActions.map((action, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.geminiInsights.searchKeywords?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag size={11} className="text-blue-400" />
                    {result.geminiInsights.searchKeywords.map((k, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Videos Scanned', value: result.summary.totalChecked, color: 'text-slate-800', bg: 'bg-white' },
                { label: 'High Risk', value: result.summary.highRisk, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Suspicious', value: result.summary.suspicious, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Possible Violations', value: result.summary.possibleViolations ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} border border-slate-200 rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Similar Videos */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                <ShieldAlert size={15} className="text-slate-500" />
                <p className="font-semibold text-slate-900 text-sm">Similar Videos on YouTube</p>
                <span className="ml-auto text-xs text-slate-400">{result.similarVideos.length} found</span>
              </div>

              {result.similarVideos.length === 0 ? (
                <div className="py-14 text-center">
                  <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
                  <p className="text-sm font-semibold text-slate-700">No similar videos found</p>
                  <p className="text-xs text-slate-400 mt-1">Your content appears to be unique on YouTube.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {result.similarVideos.map((video, i) => (
                    <SimilarVideoCard key={video.id} video={video} index={i} />
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
