'use client';

import { useMemo, useState } from 'react';
import { Check, Loader2, Lock, Save } from 'lucide-react';
import { SCORE_CATEGORIES, weightedScore, type ScoreValues } from '@/lib/scoring';

const empty: ScoreValues = {
  valuePracticality: 0,
  creativity: 0,
  aiTechnical: 0,
  completenessUx: 0,
  responsibleAi: 0,
};

export function JudgeScoreForm({
  submissionId,
  initial,
  closed,
}: {
  submissionId: string;
  initial: (ScoreValues & { notes: string | null; updatedAt: string }) | null;
  closed: boolean;
}) {
  const [values, setValues] = useState<ScoreValues>(initial || empty);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(Boolean(initial));
  const [lastSaved, setLastSaved] = useState(initial?.updatedAt || null);
  const [message, setMessage] = useState<string | null>(null);
  const complete = SCORE_CATEGORIES.every((category) => values[category.key] >= 1);
  const total = useMemo(() => complete ? weightedScore(values) : null, [values, complete]);

  async function save() {
    if (!complete) {
      setMessage('Select a score from 1 to 5 for every category.');
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/judge/scores/${submissionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...values, notes }),
    });
    const data = await response.json();
    if (response.ok) {
      setHasSaved(true);
      setLastSaved(new Date().toISOString());
      setMessage('Score saved successfully. You can edit it until judging closes.');
    } else {
      setMessage(data.error || 'Save failed.');
    }
    setSaving(false);
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your Scorecard</h2>
            <p className="mt-1 text-sm text-ink-muted">Select one score per category: 1 is lowest and 5 is highest.</p>
          </div>
          <div className="rounded-lg bg-brand-soft px-4 py-2 text-right text-brand-700">
            <p className="text-xs font-medium">Weighted total</p>
            <p className="text-xl font-semibold tabular">{total === null ? '—' : `${total.toFixed(2)} / 5`}</p>
            {total !== null && <p className="text-xs tabular">{(total * 20).toFixed(1)}%</p>}
          </div>
        </div>
      </div>

      <fieldset disabled={closed} className="divide-y divide-line">
        {SCORE_CATEGORIES.map((category) => (
          <div key={category.key} className="p-5 sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <label className="text-sm font-semibold">{category.label}</label>
              <span className="badge-muted shrink-0">{Math.round(category.weight * 100)}%</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((score) => {
                const selected = values[category.key] === score;
                return (
                  <button
                    key={score}
                    type="button"
                    aria-label={`${category.label}: ${score} out of 5`}
                    aria-pressed={selected}
                    onClick={() => setValues((current) => ({ ...current, [category.key]: score }))}
                    className={`min-h-12 rounded-lg border text-base font-semibold transition active:scale-[0.98] ${
                      selected
                        ? 'border-brand bg-brand text-white shadow-soft'
                        : 'border-line bg-white text-ink hover:border-brand hover:bg-brand-soft'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between px-1 text-[11px] text-ink-subtle"><span>Lowest</span><span>Highest</span></div>
          </div>
        ))}

        <div className="p-5 sm:p-6">
          <label className="label mb-1.5 block">Private Judge Notes (optional)</label>
          <textarea
            className="input min-h-[110px] py-2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add private observations or rationale for your score..."
            maxLength={2000}
          />
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            {message && <p className={`text-sm ${message.startsWith('Score saved') ? 'text-brand-700' : 'text-red-600'}`}>{message}</p>}
            {!message && lastSaved && <p className="text-xs text-ink-muted">Last saved {new Date(lastSaved).toLocaleString()}</p>}
          </div>
          {closed ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-red-600"><Lock className="h-4 w-4" /> Judging closed</span>
          ) : (
            <button className="btn-primary w-full sm:w-auto" disabled={saving || !complete} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : hasSaved ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {hasSaved ? 'Save Changes' : 'Save Score'}
            </button>
          )}
        </div>
      </fieldset>
    </section>
  );
}
