const SKELETON_ROWS = 5;

export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="w-full rounded-xl overflow-hidden shadow-xl shadow-black/20 flex flex-col h-full min-h-[200px] bg-surface-card border border-white/5"
    >
      {/* Header skeleton */}
      <div className="bg-surface-card-header py-1.5 px-3 border-b border-white/5 flex flex-col md:flex-row md:justify-between md:items-center gap-1">
        <div className="h-4 w-28 bg-white/10 rounded animate-pulse mx-auto md:mx-0" />
        <div className="h-3 w-20 bg-white/5 rounded animate-pulse mx-auto md:mx-0" />
      </div>

      {/* Body skeleton — rows */}
      <div className="bg-surface-card-body p-2 flex flex-col gap-1 grow">
        {Array.from({ length: SKELETON_ROWS }, (_, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr] items-center bg-surface-item rounded border border-white/5 py-1.5 px-2 gap-x-2 gap-y-1"
          >
            {/* Name placeholder */}
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
            {/* Value placeholder */}
            <div className="h-5 w-12 bg-white/10 rounded animate-pulse justify-self-center md:justify-self-end" />
            {/* Toggle placeholder */}
            <div className="md:col-span-2 flex gap-1 md:grid md:grid-cols-3 md:w-full">
              <div className="h-6 flex-1 bg-white/5 rounded-md animate-pulse" />
              <div className="h-6 flex-1 bg-white/5 rounded-md animate-pulse" />
              <div className="h-6 flex-1 bg-white/5 rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="bg-surface-card-footer p-2 flex gap-2 border-t border-white/5">
        <div className="flex-1 h-8 bg-white/5 rounded animate-pulse" />
        <div className="flex-1 h-8 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
  );
}
