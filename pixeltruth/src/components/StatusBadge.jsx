export default function StatusBadge({ status, size = 'sm' }) {
  const map = {
    'High Risk':  'bg-red-100 text-red-700 border border-red-200',
    'Suspicious': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'Safe':       'bg-green-100 text-green-700 border border-green-200',
    'Processing': 'bg-blue-100 text-blue-700 border border-blue-200',
    'Pending':    'bg-slate-100 text-slate-600 border border-slate-200',
  };
  const dot = {
    'High Risk': 'bg-red-500', 'Suspicious': 'bg-yellow-500',
    'Safe': 'bg-green-500', 'Processing': 'bg-blue-500', 'Pending': 'bg-slate-400',
  };
  const sz = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${map[status] || 'bg-slate-100 text-slate-600 border border-slate-200'} ${sz}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}
