import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader, Sparkles, ChevronDown } from 'lucide-react';
import { sendChatMessage } from '../api/ai';

const SUGGESTIONS = [
  'What does High Risk mean?',
  'How does perceptual hashing work?',
  'How do I file a DMCA takedown?',
  'What is AI-generated content detection?',
];

export default function AiChat({ initialMessage, onInitialMessageConsumed }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hi! I\'m PixelTruth AI. Ask me anything about your content analysis, violations, or copyright protection.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const buildHistory = () =>
    messages.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const history = messages.slice(1).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const { data } = await sendChatMessage(msg, history);
      setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Try again.';
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // Auto-open and send when initialMessage is provided (e.g. from Alerts page)
  useEffect(() => {
    if (initialMessage) {
      setOpen(true);
      const t = setTimeout(() => {
        send(initialMessage);
        onInitialMessageConsumed?.();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [initialMessage]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        style={{ width: 52, height: 52 }}
        aria-label="Open AI Chat"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><ChevronDown size={20} /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot size={20} /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={15} />
                <span className="font-semibold text-sm">PixelTruth AI</span>
                <span className="text-[10px] bg-blue-500/60 px-1.5 py-0.5 rounded-full">Gemini</span>
              </div>
              <button onClick={() => setOpen(false)} className="hover:bg-blue-500/40 p-1 rounded-lg transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1.5">
                    <Loader size={12} className="animate-spin text-blue-500" />
                    <span className="text-xs text-slate-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (only when no user messages yet) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-full transition-colors text-slate-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-slate-200 shrink-0">
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about your content..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none max-h-24"
                  style={{ lineHeight: '1.4' }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
