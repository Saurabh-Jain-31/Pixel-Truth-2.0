import { motion } from 'framer-motion';
import { Target, Layers, Globe, Users } from 'lucide-react';

const values = [
  { icon: Target, title: 'Our Mission', desc: 'To provide accessible, AI-driven content protection tools for creators, organizations, and platforms of all sizes.' },
  { icon: Layers, title: 'Modular Architecture', desc: 'Every layer — ingestion, fingerprinting, matching, alerting — is independently scalable and extensible.' },
  { icon: Globe, title: 'Platform Agnostic', desc: 'Works across YouTube, Instagram, Telegram, Facebook, and any platform with accessible content.' },
  { icon: Users, title: 'Built for Everyone', desc: 'From independent creators to large media organizations, PixelTruth adapts to your scale.' },
];

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-5">About PixelTruth</h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              PixelTruth is an AI-based digital content fingerprinting and unauthorized media detection system.
              It was built to address the growing challenge of unauthorized duplication and redistribution of digital media
              across social platforms.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Background */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Problem We Solve</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Platforms like Instagram, YouTube, and TikTok have enabled rapid media sharing — but also enabled
                widespread unauthorized redistribution. Content is downloaded, slightly edited, and re-uploaded
                without permission, causing revenue loss and IP violations.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                Traditional detection methods rely on file-level matching or metadata comparison, which fail when
                content is visually modified, cropped, filtered, or embedded in new formats.
              </p>
              <p className="text-slate-600 leading-relaxed">
                PixelTruth analyzes the actual visual content using perceptual fingerprinting and deep learning,
                detecting similarities even after significant modifications.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {values.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                    <Icon size={17} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Significance */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Significance of the Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { audience: 'For Creators', points: ['Protection of original work', 'Improved attribution', 'Revenue preservation'] },
              { audience: 'For Organizations', points: ['Prevention of revenue loss', 'Monitoring of media distribution', 'Legal evidence generation'] },
              { audience: 'For Platforms', points: ['Assistance in moderation', 'Copyright enforcement support', 'Scalable detection pipeline'] },
            ].map(({ audience, points }) => (
              <div key={audience} className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">{audience}</h3>
                <ul className="space-y-2">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
