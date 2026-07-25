import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from './api';

export function App() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth, retry: false });

  const status = health.isPending
    ? { label: 'Checking API…', tone: 'pending' as const }
    : health.isError
      ? { label: 'API: unreachable', tone: 'error' as const }
      : { label: 'API: connected ✓', tone: 'ok' as const };

  const toneClasses =
    status.tone === 'ok'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status.tone === 'error'
        ? 'bg-rose-500/15 text-rose-300'
        : 'bg-slate-500/15 text-slate-300';

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-sm">
        <h1 className="text-4xl font-bold tracking-tight">Rally</h1>
        <p className="mt-2 text-slate-400">
          Relationship intelligence for the events economy.
        </p>
      </div>

      <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${toneClasses}`}>
        {status.label}
      </span>

      {health.data && (
        <p className="text-xs text-slate-500">
          {health.data.service} · up {Math.floor(health.data.uptime)}s
        </p>
      )}

      <p className="text-xs text-slate-600">Skeleton only — no features yet.</p>
    </main>
  );
}
