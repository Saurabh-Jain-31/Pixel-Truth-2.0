import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Loader, AlertTriangle, CheckCircle, ExternalLink,
  Sparkles, Flag, Scale, Gavel, Camera, Mail, User,
  ShieldAlert, TrendingUp, Tag, Info, ChevronDown, ChevronUp, Link
} from 'lucide-react';
import { analyzeInstagramUrl } from '../../api/instagram';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const riskStyle = {
  High:    { border: 'border-red-300 bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700 border-red-200' },
  Medium:  { border: 'border-yellow-300 bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  Low:     { border: 'border-green-300 bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700 border-green-200' },
  Unknown: { border: 'border-slate-200 bg-slate-50',  text: 'text-slate-600',  badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const verdictStyle = {
  'Likely Original':      'bg-green-100 text-green-700 border-green-200',
  'Possibly Copyrighted': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Likely Copyrighted':   'bg-red-100 text-red-700 border-red-200',
  'Unknown':              'bg-slate-100 text-slate-600 border-slate-200',
};

const stepIcon = { camera: Camera, flag: Flag, gavel: Gavel, mail: Mail, scale: Scale };

// ─── Instagram icon (SVG since lucide doesn't have it) ────────────────────────
function InstagramIcon({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  );
}

export default function InstagramAnalyze() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedYt, setExpandedYt] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) { toast.error('Paste an Instagram URL first'); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await analyzeInstagramUrl(url.trim());
      setResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed.';
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const risk = result?.summary?.copyrightRisk || 'Unknown';
  const rs = riskStyle[risk] || riskStyle.Unknown;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <InstagramIcon size={20} className="text-pink-500" /> Instagram Copyright Analyzer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste an Instagram post, reel, or TV URL — we'll analyze it for copyright issues and tell you exactly what to do.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 border border-slate-300 rounded-xl px-4 py-3 focus-within:border-pink-400 focus-within:ring-1 focus-within:ring-pink-300 transition-all bg-slate-50">
            <InstagramIcon size={16} className="text-pink-500 shrink-0" />
            <input
              type="url" value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://www.instagram.com/reel/... or /p/..."
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>
          <button onClick={handleAnalyze} disabled={loading || !url.trim()}
            className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shrink-0">
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
          <p className="text-xs text-slate-500 flex items-center gap-1.5 px-1">
            <Loader size={11} className="animate-spin text-pink-500" />
            Fetching post metadata → AI analysis → cross-platform search...
          </p>
        )}

        {/* Example URLs */}
        <p className="text-xs text-slate-400">
          Supports: instagram.com/p/... · instagram.com/reel/... · instagram.com/tv/...
        </p>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Post info + risk banner */}
            <div className={`rounded-2xl border-2 p-5 ${rs.border}`}>
              <div className="flex gap-4 items-start">
                {result.post.thumbnail ? (
                  <img src={result.post.thumbnail} alt="post"
                    className="w-24 h-24 object-cover rounded-xl shrink-0 border border-slate-200" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0">
                    <InstagramIcon size={32} className="text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-snug">{result.post.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <User size={11} /> {result.post.author}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rs.badge}`}>
                        {risk} Risk
                      </span>
                      {result.summary.copyrightVerdict && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${verdictStyle[result.summary.copyrightVerdict] || verdictStyle.Unknown}`}>
                          {result.summary.copyrightVerdict}
                        </span>
                      )}
                    </div>
                  </div>
                  <a href={result.post.postUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 transition-colors">
                    <ExternalLink size={11} /> View on Instagram
                  </a>
                  {result.post.error && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                      <Info size={11} /> {result.post.error}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {result.geminiInsights ? (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-5 space-y-4">
                <p className="font-semibold text-sm text-purple-700 flex items-center gap-2">
                  <Sparkles size={14} /> AI Copyright Analysis
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Content Type', value: result.geminiInsights.contentType },
                    { label: 'Main Subject', value: result.geminiInsights.mainSubject },
                    { label: 'AI Generated', value: result.geminiInsights.isAiGenerated ? 'Yes' : 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-xl p-3 border border-pink-100">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                {result.geminiInsights.copyrightReason && (
                  <div className="bg-white rounded-xl p-3 border border-pink-100 flex items-start gap-2">
                    <Scale size={13} className="text-purple-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700">{result.geminiInsights.copyrightReason}</p>
                  </div>
                )}

                {result.geminiInsights.contentDescription && (
                  <p className="text-xs text-slate-600 italic">"{result.geminiInsights.contentDescription}"</p>
                )}

                {result.geminiInsights.searchKeywords?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag size={11} className="text-pink-400" />
                    {result.geminiInsights.searchKeywords.map((k, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 border border-pink-200 rounded-full">{k}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-500 flex items-center gap-2">
                <Info size={14} /> AI analysis unavailable (Gemini quota exceeded). Action guide below is still valid.
              </div>
            )}

            {/* What To Do — Action Guide */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
                <Gavel size={15} className="text-slate-600" />
                <p className="font-semibold text-slate-900 text-sm">What You Should Do</p>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${rs.badge}`}>{risk} Priority</span>
              </div>
              <div className="p-4 space-y-3">
                {result.actionGuide.map((step, i) => {
                  const Icon = stepIcon[step.icon] || Info;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex gap-3 items-start p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <Icon size={13} className="text-slate-500" /> {step.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1.5 font-medium">
                            <ExternalLink size={10} /> {step.linkText}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Report Buttons */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Flag size={14} className="text-red-500" /> Quick Report Links
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={result.reportLinks.instagramReport} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  <InstagramIcon size={14} /> Report on Instagram
                </a>
                <a href={result.reportLinks.metaDmca} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <Gavel size={14} /> File DMCA with Meta
                </a>
                <a href={result.reportLinks.instagramHelp} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
                  <Info size={14} /> Instagram Help Center
                </a>
              </div>
            </div>

            {/* Cross-platform YouTube matches */}
            {result.youtubeMatches?.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedYt(e => !e)}
                  className="w-full px-5 py-4 border-b border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors">
                  <ShieldAlert size={15} className="text-slate-500" />
                  <p className="font-semibold text-slate-900 text-sm">Same Content Found on YouTube</p>
                  <span className="ml-auto text-xs text-slate-400 mr-2">{result.youtubeMatches.length} results</span>
                  {expandedYt ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </button>

                <AnimatePresence>
                  {expandedYt && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {result.youtubeMatches.map((yt, i) => (
                          <div key={yt.id} className="p-4 flex gap-3 items-center">
                            {yt.thumbnail && <img src={yt.thumbnail} alt="" className="w-24 h-14 object-cover rounded-lg shrink-0 border border-slate-200" />}
                            <div className="flex-1 min-w-0 space-y-1">
                              <a href={yt.url} target="_blank" rel="noopener noreferrer"
                                className="text-sm font-medium text-slate-800 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                {yt.title} <ExternalLink size={10} className="shrink-0" />
                              </a>
                              <p className="text-xs text-slate-500 flex items-center gap-2">
                                <User size={10} /> {yt.channel}
                                <span>·</span>
                                {new Date(yt.publishedAt).toLocaleDateString()}
                              </p>
                              {yt.similarity > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-20 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${yt.similarity >= 60 ? 'bg-red-500' : 'bg-blue-400'}`} style={{ width: `${yt.similarity}%` }} />
                                  </div>
                                  <span className="text-xs text-slate-500">{yt.similarity}% visual match</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Copyright Risk', value: risk, color: rs.text },
                { label: 'YouTube Matches', value: result.summary.youtubeMatchesFound, color: 'text-slate-800' },
                { label: 'High Similarity', value: result.summary.highSimilarityMatches, color: 'text-red-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
