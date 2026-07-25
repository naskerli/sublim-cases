export type Stat = { label: string; value: string };

export default function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div
      className={`mb-6 grid gap-2 sm:gap-3 ${
        stats.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3"
      }`}
    >
      {stats.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
        >
          <p className="text-[10px] uppercase tracking-wide text-gray-400 sm:text-xs">
            {c.label}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900 sm:text-2xl">
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
