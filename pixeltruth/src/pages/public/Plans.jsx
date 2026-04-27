import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'For individual creators getting started.',
    features: ['5 uploads/month', 'Basic perceptual hashing', 'Dashboard access', 'Email alerts', '7-day history'],
    cta: 'Get Started',
    to: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For serious creators and small teams.',
    features: ['100 uploads/month', 'CNN deep learning matching', 'Cross-platform scanning', 'Priority alerts', '90-day history', 'PDF reports', 'API access'],
    cta: 'Start Pro',
    to: '/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For organizations and media companies.',
    features: ['Unlimited uploads', 'Full pipeline access', 'Dedicated crawling jobs', 'DMCA automation', 'Legal log storage', 'SLA guarantee', 'Custom integrations'],
    cta: 'Contact Us',
    to: '/contact',
    highlight: false,
  },
];

export default function Plans() {
  return (
    <div>
      <section className="bg-gradient-to-br from-slate-900 to-blue-950 text-white py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-slate-300 text-lg">Choose the plan that fits your content protection needs.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map(({ name, price, period, desc, features, cta, to, highlight }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-8 border ${
                  highlight
                    ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-500/30 scale-105'
                    : 'bg-white border-slate-200'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                      <Zap size={11} /> Most Popular
                    </span>
                  </div>
                )}
                <h3 className={`text-lg font-bold mb-1 ${highlight ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
                <p className={`text-sm mb-5 ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{desc}</p>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${highlight ? 'text-white' : 'text-slate-900'}`}>{price}</span>
                  <span className={`text-sm ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle size={15} className={highlight ? 'text-blue-200 mt-0.5 shrink-0' : 'text-blue-600 mt-0.5 shrink-0'} />
                      <span className={highlight ? 'text-blue-100' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={to}
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                    highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
