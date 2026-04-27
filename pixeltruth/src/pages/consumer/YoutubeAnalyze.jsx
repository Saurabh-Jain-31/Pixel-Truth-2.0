import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Video, Search, Loader, AlertTriangle, CheckCircle, ExternalLink,
  Sparkles, ShieldAlert, Eye, Scale, Gavel, TrendingUp, Tag,
  Info, ChevronDown, ChevronUp, User, Calendar, Flag, Copy,
  BarChart2, Clock, Shield, Zap, RefreshCw, Award
} from 'lucide-react';
import { analyzeYouTubeUrl } from '../../api/youtube';
import StatusBadge from '../../components/StatusBadge';

// ─── Style maps ───────────────────────────────────────────────────────────────
const riskBorder = { 'High Risk': 'border-red-200 bg-red-50', 'Suspicious': 'border-yellow-200 bg-yellow-50', 'Low': 'border-slate-100 bg-white' };
const riskPill = { 'High Risk': 'bg-red-100 text-red-700 border-red-200', 'Suspicious': 'bg-yellow-100 text-yellow-700 border-yellow-200', 'Low': 'bg-green-100 text-green-700 border-green-200' };
const verdictStyle = {
  'Definite Violation': { bg: 'bg-red-100 border-red-300', text: 'text-red-800' },
  'Likely Violation':   { bg: 'bg-red-50 border-red-200',  text: 'text-red-700' },
  'Possible Violation': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  'Probably Safe':      { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  'Cannot Determine':   { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600' },
};
const legalStrengthColor = { 'Strong Case': 'text-green-600', 'Moderate Case': 'text-yellow-600', 'Weak Case': 'text-orange-500', 'No Case': 'text-slate-400' };
const monetizationColor = { High: 'text-red-600 bg-red-50 border-red-200', Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', Low: 'text-green-600 bg-green-50 border-green-200' };

// ─── Channel reputation badge ─────────────────────────────────────────────────
function ChannelBadge({ stats }) {
  if (!stats) return null;
  const subs = parseInt(stats.subscriberCount) || 0;
  const tier = subs > 1000000 ? { label: 'Major Channel', color: 'text-purple-700 bg-purple-50 border-purple-200' }
    : subs > 100000 ? { label: 'Verified Channel', color: 'text-blue-700 bg-blue-50 border-blue-200' }
    : subs > 10000 ? { label: 'Growing Channel', color: 'text-green-700 bg-green-50 border-green-200' }
    : { label: 'Small Channel', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tier.color}`}>
      <Award size={9} className="inline mr-1" />{tier.label} · {subs > 1000000 ? `${(subs/1000000).toFixed(1)}M` : subs > 1000 ? `${(subs/1000).toFixed(0)}K` : subs} subs
    </span>
  );
}

// ─── Deep analysis card ───────────────────────────────────────────────────────
function DeepAnalysisPanel({ da }) {
  if (!da) return null;
  const vs = verdictStyle[da.verdict] || verdictStyle['Cannot Determine'];
  const mc = monetizationColor[da.monetizationRisk] || monetizationColor.Low;
  return (
    <div className="space-y-3 pt-2">
      {/* Verdict + legal strength row */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${vs.bg} ${vs.text}`}>
          <Gavel size={10} className="inline mr-1" />{da.verdict}
          {da.confidence != null && <span className="opacity-60 ml-1">· {da.confidence}%</span>}
        </span>
        {da.legalStrength && (
          <span className={`text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-medium ${legalStrengthColor[da.legalStrength] || 'text-slate-600'}`}>
            <Scale size={10} className="inline mr-1" />{da.legalStrength}
          </span>
        )}
        {da.monetizationRisk && (
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${mc}`}>
            <BarChart2 size={10} className="inline mr-1" />Monetization Risk: {da.monetizationRisk}
          </span>
        )}
        {da.estimatedTimeToResolve && (
          <span className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium">
            <Clock size={10} className="inline mr-1" />Resolve in: {da.estimatedTimeToResolve}
          </span>
        )}
      </div>

      {/* Deep analysis paragraph */}
      {da.deepAnalysis && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
          <p className="text-xs text-slate-700 leading-relaxed">{da.deepAnalysis}</p>
        </div>
      )}

      {/* Evidence points */}
      {da.evidencePoints?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Shield size={11} /> Evidence Points</p>
          <div className="space-y-1">
            {da.evidencePoints.map((e, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span> {e}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {da.immediateActions?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1"><Zap size={10} /> Do Right Now</p>
            {da.immediateActions.map((a, i) => (
              <div key={i} className="text-xs text-red-800 flex items-start gap-1.5 mb-1">
                <span className="shrink-0">→</span> {a}
              </div>
            ))}
          </div>
        )}
        {da.longTermActions?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1"><Clock size={10} /> Long-Term Protection</p>
            {da.longTermActions.map((a, i) => (
              <div key={i} className="text-xs text-blue-800 flex items-start gap-1.5 mb-1">
                <span className="shrink-0">→</span> {a}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Similar video card ───────────────────────────────────────────────────────
function SimilarVideoCard({ video, index }) {
  const [expanded, setExpanded] = useState(false);
  const da = video.deepAnalysis;
  const diff = video.differences;
  const reupload = video.reuploadInfo;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border overflow-hidden ${riskBorder[video.riskLevel]}`}>

      {/* Main row */}
      <div className="p-4 flex gap-3 items-start">
        {video.thumbnail && (
          <img src={video.thumbnail} alt="" className="w-32 object-cover rounded-lg shrink-0 border border-slate-200" style={{ height: 72 }} />
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <a href={video.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-800 hover:text-blue-600 flex items-center gap-1 leading-snug transition-colors">
              {video.title} <ExternalLink size={11} className="shrink-0 opacity-60" />
            </a>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${riskPill[video.riskLevel]}`}>{video.riskLevel}</span>
              {reupload?.isReupload && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-orange-100 text-orange-700 border-orange-200 font-medium flex items-center gap-1">
                  <RefreshCw size={9} /> Re-upload
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-slate-700"><User size={10} /> {video.channel}</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(video.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            {reupload?.isReupload && <span className="text-orange-600 font-medium">{reupload.daysAfter}d after original</span>}
            {reupload?.daysBefore > 0 && <span className="text-slate-400">{reupload.daysBefore}d before original</span>}
          </div>

          <ChannelBadge stats={video.candidateChannelStats} />

          {/* Similarity bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-36 bg-slate-200 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${video.similarity}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className={`h-full rounded-full ${video.similarity >= 90 ? 'bg-red-500' : video.similarity >= 70 ? 'bg-yellow-500' : 'bg-blue-400'}`} />
            </div>
            <span className="text-xs font-bold text-slate-600">{video.similarity}% similar</span>
          </div>

          {/* Quick verdict */}
          {da && (() => {
            const vs = verdictStyle[da.verdict] || verdictStyle['Cannot Determine'];
            return (
              <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border font-medium ${vs.bg} ${vs.text}`}>
                <Gavel size={10} /> {da.verdict}
                {da.confidence != null && <span className="opacity-60">· {da.confidence}%</span>}
              </div>
            );
          })()}
        </div>

        <button onClick={() => setExpanded(e => !e)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 mt-1">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-slate-200 bg-white p-4 space-y-4">

              {/* Similar vs Different */}
              {diff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diff.similar?.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1"><AlertTriangle size={10} /> What's Similar</p>
                      {diff.similar.map((s, i) => <div key={i} className="text-xs text-yellow-800 flex items-start gap-1.5 mb-1"><span>•</span>{s}</div>)}
                    </div>
                  )}
                  {diff.different?.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><CheckCircle size={10} /> What's Different</p>
                      {diff.different.map((d, i) => <div key={i} className="text-xs text-green-800 flex items-start gap-1.5 mb-1"><span>•</span>{d}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* Deep AI analysis */}
              {da && <DeepAnalysisPanel da={da} />}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <a href={video.copyrightComplaintUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors">
                  <Flag size={11} /> File Copyright Complaint
                </a>
                <a href="https://support.google.com/youtube/answer/2807622" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors">
                  <ExternalLink size={11} /> DMCA Guide
                </a>
                <a href={video.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
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

// ─── Main page ────────────────────────────────────────────────────────────────
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
    } finally { setLoading(false); }
  };

  const copyReport = () => {
    if (!result) return;
    const lines = [
      `PixelTruth YouTube Analysis Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `SOURCE VIDEO: ${result.source.title}`,
      `Channel: ${result.source.channel}`,
      `Published: ${new Date(result.source.publishedAt).toLocaleDateString()}`,
      `Views: ${parseInt(result.source.viewCount || 0).toLocaleString()}`,
      `URL: ${result.source.url}`,
      ``,
      `OVERALL STATUS: ${result.summary.overallStatus}`,
      `Videos Scanned: ${result.summary.totalChecked}`,
      `High Risk: ${result.summary.highRisk}`,
      `Suspicious: ${result.summary.suspicious}`,
      `Possible Violations: ${result.summary.possibleViolations}`,
      `Re-uploads Detected: ${result.summary.reuploadDetected}`,
      ``,
      `SIMILAR VIDEOS:`,
      ...result.similarVideos.map((v, i) =>
        `${i + 1}. ${v.title}\n   Channel: ${v.channel} | Date: ${new Date(v.publishedAt).toLocaleDateString()} | Similarity: ${v.similarity}% | Risk: ${v.riskLevel}\n   URL: ${v.url}${v.reuploadInfo?.isReupload ? ` [RE-UPLOAD: ${v.reuploadInfo.daysAfter} days after original]` : ''}`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Report copied to clipboard');
  };

  const src = result?.source;
  const copyrightVerdictStyle = {
    'Likely Original': 'bg-green-50 border-green-200 text-green-700',
    'Possibly Copyrighted': 'bg-yellow-50 border-yellow-200 text-yellow-700',
    'Likely Copyrighted': 'bg-red-50 border-red-200 text-red-700',
    'Unknown': 'bg-slate-50 border-slate-200 text-slate-600',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Video size={20} className="text-red-500" /> YouTube Copyright Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Deep analysis: find copies, detect re-uploads, get legal strength assessment, monetization risk, and step-by-step action plan.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400 transition-all bg-slate-50">
            <Video size={16} className="text-red-500 shrink-0" />
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none" />
          </div>
          <button onClick={handleAnalyze} disabled={loading || !url.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shrink-0">
            {loading ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}</div>}
        {loading && <p className="text-xs text-slate-500 flex items-center gap-1.5 px-1"><Loader size={11} className="animate-spin text-blue-500" /> Fetching metadata + channel stats → scanning YouTube → deep AI copyright analysis...</p>}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Source video */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Eye size={14} className="text-blue-500" />
                <p className="font-semibold text-slate-900 text-sm">Source Video</p>
                <div className="ml-auto flex items-center gap-2">
                  <StatusBadge status={result.summary.overallStatus} />
                  <button onClick={copyReport} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors font-medium">
                    <Copy size={11} /> Export Report
                  </button>
                </div>
              </div>
              <div className="p-5 flex gap-4">
                {src?.thumbnail && <img src={src.thumbnail} alt="" className="w-44 object-cover rounded-xl shrink-0 border border-slate-200" style={{ height: 96 }} />}
                <div className="flex-1 min-w-0 space-y-2">
                  <a href={src?.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-slate-900 hover:text-blue-600 flex items-start gap-1.5 text-sm leading-snug transition-colors">
                    {src?.title} <ExternalLink size={12} className="mt-0.5 shrink-0" />
                  </a>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700"><User size={10} /> {src?.channel}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {src?.publishedAt ? new Date(src.publishedAt).toLocaleDateString() : '—'}</span>
                    {src?.viewCount && <span className="flex items-center gap-1"><TrendingUp size={10} /> {parseInt(src.viewCount).toLocaleString()} views</span>}
                    {src?.durationSec > 0 && <span className="flex items-center gap-1"><Clock size={10} /> {Math.floor(src.durationSec/60)}:{String(src.durationSec%60).padStart(2,'0')}</span>}
                  </div>
                  <ChannelBadge stats={src?.channelStats} />
                  {result.geminiInsights?.copyrightVerdict && (
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${copyrightVerdictStyle[result.geminiInsights.copyrightVerdict] || copyrightVerdictStyle['Unknown']}`}>
                      <Scale size={10} /> {result.geminiInsights.copyrightVerdict}
                      {result.geminiInsights.licenseType && result.geminiInsights.licenseType !== 'Unknown' && <span className="opacity-70">· {result.geminiInsights.licenseType}</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {result.geminiInsights && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4">
                <p className="font-semibold text-sm text-blue-700 flex items-center gap-2"><Sparkles size={14} /> AI Copyright Analysis</p>
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
                {result.geminiInsights.suggestedActions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1"><Gavel size={11} /> Suggested Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {result.geminiInsights.suggestedActions.map((a, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium">{a}</span>
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

            {/* Summary stats */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { label: 'Scanned', value: result.summary.totalChecked, color: 'text-slate-800', bg: 'bg-white' },
                { label: 'High Risk', value: result.summary.highRisk, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Suspicious', value: result.summary.suspicious, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Violations', value: result.summary.possibleViolations ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Re-uploads', value: result.summary.reuploadDetected ?? 0, color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} border border-slate-200 rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Similar videos */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
                <ShieldAlert size={15} className="text-slate-500" />
                <p className="font-semibold text-slate-900 text-sm">Similar Videos — Deep Analysis</p>
                <span className="ml-auto text-xs text-slate-400">{result.similarVideos.length} found</span>
              </div>
              {result.similarVideos.length === 0 ? (
                <div className="py-14 text-center">
                  <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
                  <p className="text-sm font-semibold text-slate-700">No similar videos found</p>
                  <p className="text-xs text-slate-400 mt-1">Your content appears unique on YouTube.</p>
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
