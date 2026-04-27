import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Eye, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const highlights = [
  { icon: Shield, title: 'AI Fingerprinting', desc: 'Perceptual hashing + CNN feature vectors for robust content identity.' },
  { icon: Eye, title: 'Cross-Platform Scan', desc: 'Detect unauthorized copies across YouTube, Instagram, Telegram and more.' },
  { icon: Zap, title: 'Real-Time Alerts', desc: 'Instant notifications when a violation is detected.' },
  { icon: Lock, title: 'Rights Management', desc: 'Verify uploader permissions and store authorization records.' },
];

const stats = [
  { value: '99.2%', label: 'Detection Accuracy' },
  { value: '<2s', label: 'Avg. Analysis Time' },
  { value: '5+', label: 'Platforms Monitored' },
  { value: '10K+', label: 'Content Scanned' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              AI-Powered Content Protection
            </span>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Protect Your Digital Content with{' '}
              <span className="text-blue-400">AI Fingerprinting</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
              PixelTruth detects unauthorized reuse of your videos and images across platforms — even after cropping, filtering, or re-encoding — using perceptual hashing and deep learning.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/analyze" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
                Start Analyzing <ArrowRight size={16} />
              </Link>
              <Link to="/features" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors">
                See How It Works
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center text-white">
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-blue-200 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Why PixelTruth?</h2>
            <p className="text-slate-500 max-w-xl mx-auto">A modular, AI-driven pipeline that goes beyond metadata matching.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500">Three simple steps to protect your content.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Content', desc: 'Upload your video or image. Our system extracts frames and generates a unique fingerprint.' },
              { step: '02', title: 'AI Analysis', desc: 'Perceptual hashing and CNN feature extraction create a robust identity for your content.' },
              { step: '03', title: 'Monitor & Alert', desc: 'Continuous scanning across platforms. Get instant alerts when a match is found.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative p-8 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-6xl font-black text-blue-100 absolute top-4 right-6">{step}</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 relative">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed relative">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to protect your content?</h2>
          <p className="text-blue-200 mb-8">Join creators and organizations using PixelTruth to safeguard their digital media.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup" className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
              Get Started Free
            </Link>
            <Link to="/plans" className="px-8 py-3 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
