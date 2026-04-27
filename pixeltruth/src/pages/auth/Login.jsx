import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { login, googleLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('consumer'); // 'consumer' | 'admin'
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // Google sign-in (consumer only)
  const handleGoogle = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await googleLogin(credentialResponse.credential);
      signIn(data.token, data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google sign-in failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Admin manual login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login({ ...form, role: 'admin' });
      signIn(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' ? 'Cannot connect to server.' : 'Login failed.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

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
          <p className="text-slate-500 text-sm mt-3">Sign in to your account</p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-200 rounded-xl p-1 mb-6">
          {[{ value: 'consumer', label: 'Consumer' }, { value: 'admin', label: 'Admin' }].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setMode(value); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {mode === 'consumer' ? (
            /* ── Google Sign-In ── */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-slate-700 font-medium">Sign in with Google</p>
                <p className="text-xs text-slate-400">No password needed — just your Google account</p>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogle}
                  onError={() => { setError('Google sign-in was cancelled or failed.'); }}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  width="320"
                  text="signin_with"
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Loader size={14} className="animate-spin" /> Signing you in...
                </div>
              )}
            </div>
          ) : (
            /* ── Admin Manual Login ── */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input type="email" required value={form.email}
                  onChange={e => { setError(''); setForm(f => ({ ...f, email: e.target.value })); }}
                  placeholder="admin@example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={form.password}
                    onChange={e => { setError(''); setForm(f => ({ ...f, password: e.target.value })); }}
                    placeholder="Enter your password" className={inputClass + ' pr-10'} />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                {loading && <Loader size={15} className="animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In as Admin'}
              </button>
            </form>
          )}

          {mode === 'consumer' && (
            <p className="text-center text-sm text-slate-500 mt-6">
              New here?{' '}
              <Link to="/signup" className="text-blue-600 font-medium hover:underline">Create account</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
