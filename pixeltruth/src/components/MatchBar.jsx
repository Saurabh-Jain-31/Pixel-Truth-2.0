export default function MatchBar({ value }) {
  const color = value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-yellow-500' : 'bg-green-500';
  const text  = value >= 90 ? 'text-red-600' : value >= 70 ? 'text-yellow-600' : 'text-green-600';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold w-9 text-right ${text}`}>{value}%</span>
    </div>
  );
}
