'use client';
import { useEffect, useState } from 'react';

function diff(target: Date) {
  const ms = target.getTime() - Date.now();
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s, total, ms };
}

export function Countdown({ deadline }: { deadline: string | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!deadline) {
    return (
      <div className="card p-6 text-center">
        <p className="label mb-2">Submission Deadline</p>
        <p className="text-2xl font-semibold tracking-tight text-ink-muted">Not yet set by admin</p>
      </div>
    );
  }
  const d = new Date(deadline);
  const t = diff(d);
  const closed = t.total === 0;
  const urgent = t.total > 0 && t.total < 86400;
  const critical = t.total > 0 && t.total < 3600;
  const tone = closed ? 'text-red-600' : critical ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-ink';

  return (
    <div className="card p-6">
      <p className="label mb-3 text-center">Time Remaining</p>
      {closed ? (
        <p className="text-3xl font-semibold tracking-tight text-center text-red-600">
          Submissions Closed
        </p>
      ) : (
        <div className={`grid grid-cols-4 gap-3 ${tone} tabular`}>
          {[
            { v: t.d, l: 'Days' },
            { v: t.h, l: 'Hours' },
            { v: t.m, l: 'Minutes' },
            { v: t.s, l: 'Seconds' },
          ].map((x) => (
            <div key={x.l} className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight">{String(x.v).padStart(2, '0')}</div>
              <div className="label mt-1">{x.l}</div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-ink-muted text-center mt-4">
        Closes at {d.toLocaleString()}
      </p>
    </div>
  );
}

export function CountdownInline({ deadline }: { deadline: string | null }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deadline) return <span className="text-xs text-ink-muted">No deadline set</span>;
  const t = diff(new Date(deadline));
  if (t.total === 0) return <span className="text-xs font-medium text-red-600">Closed</span>;
  const tone = t.total < 3600 ? 'text-red-600' : t.total < 86400 ? 'text-amber-600' : 'text-ink';
  return (
    <span className={`text-xs font-medium tabular ${tone}`}>
      {t.d}d {String(t.h).padStart(2, '0')}:{String(t.m).padStart(2, '0')}:{String(t.s).padStart(2, '0')}
    </span>
  );
}
