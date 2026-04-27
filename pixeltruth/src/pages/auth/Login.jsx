import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', role: 'consumer' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(form);
      signIn(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Make sure the backend is running on port 5000.'
          : 'Login failed. Check your credentials.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Sign in as</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'consumer', label: 'Consumer', desc: 'Upload & analyze content' },
                { value: 'admin', label: 'Admin', desc: 'Manage the platform' },
              ].map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: value }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.role === value
                      ? value === 'admin'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <p className={`text-sm font-semibold ${
                    form.role === value
                      ? value === 'admin' ? 'text-purple-700' : 'text-blue-700'
                      : 'text-slate-700'
                  }`}>{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => { setError(''); setForm(f => ({ ...f, email: e.target.value })); }}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => { setError(''); setForm(f => ({ ...f, password: e.target.value })); }}
                  placeholder="Enter your password"
                  className={inputClass + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 ${
                form.role === 'admin'
                  ? 'bg-purple-600 hover:bg-purple-700 disabled:opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-60'
              }`}
            >
              {loading && <Loader size={15} className="animate-spin" />}
              {loading ? 'Signing in...' : `Sign In as ${form.role === 'admin' ? 'Admin' : 'Consumer'}`}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">Sign Up</Link>
          </p>

          {/* Backend hint */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Backend must be running on{' '}
              <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded text-xs">localhost:5000</code>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
