import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Analyze() {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
      <div className="max-w-lg w-full mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
            {user ? <Upload size={28} className="text-blue-600" /> : <Lock size={28} className="text-blue-600" />}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {user ? 'Analyze Your Content' : 'Sign In to Analyze'}
          </h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {user
              ? 'Head to your dashboard to upload and analyze content for unauthorized copies.'
              : 'Create a free account or log in to start uploading and analyzing your digital content for unauthorized redistribution.'
            }
          </p>
          {user ? (
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Upload <ArrowRight size={16} />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors">
                Create Free Account
              </Link>
              <Link to="/login" className="px-8 py-3 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-xl transition-colors">
                Log In
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
