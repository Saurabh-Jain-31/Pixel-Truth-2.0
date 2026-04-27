import { motion } from 'framer-motion';
import {
  Upload, Cpu, Database, Search, GitMerge, ShieldCheck, Bell, FileText,
  Film, Hash, BrainCircuit, PlayCircle, Globe, BarChart2, CheckCircle, AlertTriangle
} from 'lucide-react';

const pipeline = [
  {
    id: '01',
    icon: Upload,
    color: 'blue',
    title: 'Content Ingestion Layer',
    desc: 'Entry point for all media content. Handles uploads and extracts raw data for processing.',
    features: [
      { icon: Film, text: 'Upload video or image files via drag-and-drop or API' },
      { icon: Film, text: 'Frame extraction from video using FFmpeg (keyframes + uniform sampling)' },
      { icon: Film, text: 'Resolution and format detection (MP4, MOV, AVI, MKV, JPG, PNG)' },
      { icon: Film, text: 'Metadata extraction: title, owner, duration, codec, bitrate' },
    ],
  },
  {
    id: '02',
    icon: Cpu,
    color: 'purple',
    title: 'Fingerprinting Engine',
    desc: 'Generates a unique, robust identity for each piece of content using multiple techniques.',
    features: [
      { icon: Hash, text: 'Basic hashing (MD5/SHA256) for exact duplicate detection' },
      { icon: Hash, text: 'Perceptual Hashing (pHash, dHash) via imagehash + OpenCV — robust to resizing, filters' },
      { icon: BrainCircuit, text: 'Deep Learning feature extraction using ResNet-50 CNN (2048-dim vectors)' },
      { icon: BrainCircuit, text: 'Audio fingerprinting for video content (chromaprint / spectral analysis)' },
    ],
  },
  {
    id: '03',
    icon: Database,
    color: 'green',
    title: 'Database Storage Layer',
    desc: 'Persistent storage for all content references, fingerprints, and metadata.',
    features: [
      { icon: Database, text: 'MongoDB for flexible document storage of media metadata' },
      { icon: Database, text: 'Fingerprint vectors stored with content ID references' },
      { icon: Database, text: 'GridFS or cloud storage (S3) for original media files' },
      { icon: Database, text: 'Indexed collections for fast similarity lookups' },
    ],
  },
  {
    id: '04',
    icon: Search,
    color: 'orange',
    title: 'Crawling & Scanning System',
    desc: 'Actively discovers potentially infringing content across platforms.',
    features: [
      { icon: PlayCircle, text: 'YouTube Data API v3 — keyword search, video metadata retrieval' },
      { icon: Globe, text: 'Twitter/X API — media tweet scanning and download' },
      { icon: Globe, text: 'Web scraping via BeautifulSoup and Selenium for non-API platforms' },
      { icon: Search, text: 'Scheduled crawl jobs with configurable frequency and keyword sets' },
    ],
  },
  {
    id: '05',
    icon: GitMerge,
    color: 'cyan',
    title: 'Feature Extraction & Matching',
    desc: 'Processes discovered content and compares against stored fingerprints.',
    features: [
      { icon: Film, text: 'Frame extraction from scanned content (same pipeline as ingestion)' },
      { icon: Hash, text: 'Fingerprint generation for each discovered item' },
      { icon: BarChart2, text: 'Cosine similarity for CNN feature vectors (float comparison)' },
      { icon: Hash, text: 'Hamming distance for perceptual hashes (bit-level comparison)' },
    ],
  },
  {
    id: '06',
    icon: BarChart2,
    color: 'yellow',
    title: 'Matching Algorithm & Risk Scoring',
    desc: 'Determines similarity level and assigns a risk classification.',
    features: [
      { icon: AlertTriangle, text: '≥ 90% similarity → High Risk (likely unauthorized copy)' },
      { icon: AlertTriangle, text: '70–89% similarity → Suspicious (possible re-encoded version)' },
      { icon: CheckCircle, text: '< 70% similarity → Safe (no significant match found)' },
      { icon: BarChart2, text: 'Confidence score computed from weighted multi-method average' },
    ],
  },
  {
    id: '07',
    icon: ShieldCheck,
    color: 'teal',
    title: 'Authorization Check',
    desc: 'Verifies whether detected usage is licensed or permitted.',
    features: [
      { icon: ShieldCheck, text: 'Uploader permission verification against rights database' },
      { icon: ShieldCheck, text: 'Licensed content registry stored in MongoDB' },
      { icon: ShieldCheck, text: 'Authorized user records with expiry and scope' },
      { icon: ShieldCheck, text: 'Automatic clearance for whitelisted sources' },
    ],
  },
  {
    id: '08',
    icon: Bell,
    color: 'red',
    title: 'Alert System',
    desc: 'Notifies rights holders when a violation is detected.',
    features: [
      { icon: Bell, text: 'Real-time dashboard alerts for High Risk and Suspicious matches' },
      { icon: Bell, text: 'Email notifications to registered content owners' },
      { icon: Bell, text: 'Alert history with timestamps, source, and match score' },
      { icon: Bell, text: 'Configurable thresholds per user account' },
    ],
  },
  {
    id: '09',
    icon: FileText,
    color: 'indigo',
    title: 'Action & Evidence System',
    desc: 'Enables legal action and maintains a complete audit trail.',
    features: [
      { icon: FileText, text: 'Automated DMCA takedown request generation' },
      { icon: FileText, text: 'Evidence package: matched frames, similarity metrics, timestamps' },
      { icon: FileText, text: 'Legal log storage with immutable records in MongoDB' },
      { icon: FileText, text: 'PDF report export for each violation case' },
    ],
  },
];

const colorMap = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600',   border: 'border-blue-200',   badge: 'bg-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-600' },
  green:  { bg: 'bg-green-100',  text: 'text-green-600',  border: 'border-green-200',  badge: 'bg-green-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', badge: 'bg-orange-600' },
  cyan:   { bg: 'bg-cyan-100',   text: 'text-cyan-600',   border: 'border-cyan-200',   badge: 'bg-cyan-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-500' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-600',   border: 'border-teal-200',   badge: 'bg-teal-600' },
  red:    { bg: 'bg-red-100',    text: 'text-red-600',    border: 'border-red-200',    badge: 'bg-red-600' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', badge: 'bg-indigo-600' },
};

export default function Features() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-5">System Pipeline & Features</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              A complete 9-layer AI pipeline for digital content fingerprinting, unauthorized media detection,
              and rights enforcement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {pipeline.map(({ id, icon: Icon, color, title, desc, features }, i) => {
              const c = colorMap[color];
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-2xl border ${c.border} p-8`}
                >
                  <div className="flex items-start gap-6">
                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
                        <Icon size={22} className={c.text} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${c.badge}`}>Layer {id}</span>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                      </div>
                      <p className="text-slate-500 text-sm mb-5">{desc}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {features.map(({ text }, fi) => (
                          <div key={fi} className="flex items-start gap-2.5">
                            <CheckCircle size={14} className={`${c.text} mt-0.5 shrink-0`} />
                            <span className="text-sm text-slate-700">{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
