export default function SkeletonRow({ cols = 5, dark = false }) {
  const bg = dark ? 'bg-slate-700' : 'bg-slate-200';
  return (
    <tr className="border-b border-slate-200">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`h-3 ${bg} rounded animate-pulse`} style={{ width: `${55 + (i * 13) % 35}%` }} />
        </td>
      ))}
    </tr>
  );
}
