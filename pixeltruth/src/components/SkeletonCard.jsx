export default function SkeletonCard({ dark = false }) {
  const bg = dark ? 'bg-slate-700' : 'bg-slate-200';
  const card = dark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white border-slate-200';
  return (
    <div className={`border rounded-xl p-5 animate-pulse ${card}`}>
      <div className={`h-3 ${bg} rounded w-1/3 mb-3`} />
      <div className={`h-8 ${bg} rounded w-1/2 mb-2`} />
      <div className={`h-2 ${bg} rounded w-2/3`} />
    </div>
  );
}
