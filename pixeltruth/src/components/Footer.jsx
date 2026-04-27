import { Link } from 'react-router-dom';
import { Shield, ExternalLink, AtSign, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg">PixelTruth</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered digital content fingerprinting and unauthorized media detection system.
            </p>
            <div className="flex gap-3 mt-4">
              {[ExternalLink, AtSign, Mail].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Product</p>
            <div className="space-y-2">
              {[['Features', '/features'], ['Plans', '/plans'], ['Analyze', '/analyze']].map(([l, to]) => (
                <Link key={l} to={to} className="block text-sm hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Company</p>
            <div className="space-y-2">
              {[['About', '/about'], ['Contact', '/contact'], ['Privacy Policy', '#'], ['Terms', '#']].map(([l, to]) => (
                <Link key={l} to={to} className="block text-sm hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-6 text-xs text-center">
          © {new Date().getFullYear()} PixelTruth. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
