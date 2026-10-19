import type { RankingRow } from '@/lib/ranking';

const medal: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function score(value: number, available: boolean) {
  return available ? value.toFixed(2) : '—';
}

export function RankingTable({ rows, showJudgeCount = false }: { rows: RankingRow[]; showJudgeCount?: boolean }) {
  if (rows.length === 0) {
    return <div className="card p-12 text-center text-sm text-ink-muted">No finalists selected yet.</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-line bg-white shadow-soft md:block">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Team / Project</th>
              <th className="px-3 py-3 font-medium">Value<br /><span className="font-normal">30%</span></th>
              <th className="px-3 py-3 font-medium">Creativity<br /><span className="font-normal">30%</span></th>
              <th className="px-3 py-3 font-medium">AI Quality<br /><span className="font-normal">20%</span></th>
              <th className="px-3 py-3 font-medium">UX<br /><span className="font-normal">10%</span></th>
              <th className="px-3 py-3 font-medium">Responsible AI<br /><span className="font-normal">10%</span></th>
              {showJudgeCount && <th className="px-3 py-3 font-medium">Judges</th>}
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const available = row.total !== null;
              return (
                <tr key={row.submissionId} className="border-b border-line last:border-0">
                  <td className="px-4 py-4 text-lg">{row.rank ? medal[row.rank] || `#${row.rank}` : '—'}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{row.teamName}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{row.projectName}</p>
                  </td>
                  <td className="px-3 py-4 tabular">{score(row.valuePracticality, available)}</td>
                  <td className="px-3 py-4 tabular">{score(row.creativity, available)}</td>
                  <td className="px-3 py-4 tabular">{score(row.aiTechnical, available)}</td>
                  <td className="px-3 py-4 tabular">{score(row.completenessUx, available)}</td>
                  <td className="px-3 py-4 tabular">{score(row.responsibleAi, available)}</td>
                  {showJudgeCount && <td className="px-3 py-4 tabular">{row.judgeCount}</td>}
                  <td className="px-4 py-4 text-right">
                    {available ? (
                      <><p className="font-semibold tabular">{row.total!.toFixed(2)} / 5</p><p className="text-xs text-ink-muted tabular">{row.percentage!.toFixed(1)}%</p></>
                    ) : <span className="text-ink-muted">Not scored</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const available = row.total !== null;
          return (
            <article key={row.submissionId} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="text-xl">{row.rank ? medal[row.rank] || `#${row.rank}` : '—'}</span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{row.teamName}</h3>
                    <p className="truncate text-sm text-ink-muted">{row.projectName}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular">{available ? `${row.total!.toFixed(2)} / 5` : '—'}</p>
                  {available && <p className="text-xs text-ink-muted tabular">{row.percentage!.toFixed(1)}%</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Score label="Value" value={score(row.valuePracticality, available)} />
                <Score label="Creativity" value={score(row.creativity, available)} />
                <Score label="AI Quality" value={score(row.aiTechnical, available)} />
                <Score label="UX" value={score(row.completenessUx, available)} />
                <Score label="Responsible AI" value={score(row.responsibleAi, available)} />
                {showJudgeCount && <Score label="Judges" value={String(row.judgeCount)} />}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-bg-subtle p-2"><span className="text-ink-muted">{label}</span><strong className="float-right tabular">{value}</strong></div>;
}
