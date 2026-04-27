import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Loader, AlertCircle } from 'lucide-react';
import { googleLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await googleLogin(credentialResponse.credential);
      signIn(data.token, data.user);
      toast.success(`Account ready! Welcome, ${data.user.name}`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-up failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl">PixelTruth</span>
          </Link>
          <p className="text-slate-500 text-sm mt-3">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-slate-700 font-medium">Sign up with Google</p>
            <p className="text-xs text-slate-400">One click — no password, no forms</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError('Google sign-up was cancelled or failed.')}
              theme="outline"
              size="large"
              shape="rectangular"
              width="320"
              text="signup_with"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader size={14} className="animate-spin" /> Setting up your account...
            </div>
          )}

          {/* What you get */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            {['Upload & analyze content for copyright violations', 'AI-powered similarity detection', 'YouTube video comparison', 'Real-time alerts & violation tracking'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
