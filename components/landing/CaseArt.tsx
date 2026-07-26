// Landing üçün dekorativ kabro vizualı (şəkil faylı tələb etmir).
export default function CaseArt({
  gradient,
  emoji,
  label,
  className = "",
  rotate = 0,
  delay = 0,
  float = true,
}: {
  gradient: string;
  emoji?: string;
  label?: string;
  className?: string;
  rotate?: number;
  delay?: number;
  float?: boolean;
}) {
  return (
    <div
      className={`relative rounded-[2rem] p-1.5 shadow-2xl ring-1 ring-black/5 ${gradient} ${
        float ? "sc-float" : ""
      } ${className}`}
      style={
        {
          "--sc-rot": `${rotate}deg`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[1.65rem] bg-white/10 backdrop-blur-sm">
        {emoji && <span className="text-4xl drop-shadow">{emoji}</span>}
        {label && (
          <span className="px-3 text-center text-xs font-bold uppercase tracking-wider text-white/90 drop-shadow">
            {label}
          </span>
        )}
      </div>

      {/* Kamera modulu */}
      <div className="absolute right-2.5 top-2.5 h-12 w-12 rounded-xl bg-black/35 backdrop-blur">
        <div className="grid h-full grid-cols-2 place-items-center p-1.5">
          <span className="h-3.5 w-3.5 rounded-full bg-gray-900/80 ring-1 ring-white/25" />
          <span className="h-3.5 w-3.5 rounded-full bg-gray-900/80 ring-1 ring-white/25" />
          <span className="h-3.5 w-3.5 rounded-full bg-gray-900/80 ring-1 ring-white/25" />
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-200/80" />
        </div>
      </div>
    </div>
  );
}
