import { prisma } from './db';
import { weightedScore, type ScoreValues } from './scoring';

export type RankingRow = ScoreValues & {
  submissionId: string;
  teamName: string;
  projectName: string;
  judgeCount: number;
  total: number | null;
  percentage: number | null;
  rank: number | null;
};

export async function getRanking(judgeId?: string): Promise<RankingRow[]> {
  const submissions = await prisma.submission.findMany({
    where: { isFinalist: true, status: 'submitted' },
    include: {
      scores: { where: judgeId ? { judgeId } : undefined },
    },
    orderBy: { finalistSelectedAt: 'asc' },
  });

  const rows: RankingRow[] = submissions.map((submission) => {
    const scores = submission.scores;
    const average = (key: keyof ScoreValues) =>
      scores.length ? scores.reduce((sum, score) => sum + score[key], 0) / scores.length : 0;

    const values: ScoreValues = {
      valuePracticality: average('valuePracticality'),
      creativity: average('creativity'),
      aiTechnical: average('aiTechnical'),
      completenessUx: average('completenessUx'),
      responsibleAi: average('responsibleAi'),
    };
    const total = scores.length ? weightedScore(values) : null;

    return {
      submissionId: submission.id,
      teamName: submission.teamName,
      projectName: submission.projectName,
      judgeCount: scores.length,
      ...values,
      total,
      percentage: total === null ? null : total * 20,
      rank: null,
    };
  });

  rows.sort((a, b) => {
    if (a.total === null) return b.total === null ? a.teamName.localeCompare(b.teamName) : 1;
    if (b.total === null) return -1;
    return (
      b.total - a.total ||
      b.valuePracticality - a.valuePracticality ||
      b.creativity - a.creativity ||
      b.aiTechnical - a.aiTechnical ||
      b.completenessUx - a.completenessUx ||
      b.responsibleAi - a.responsibleAi ||
      a.teamName.localeCompare(b.teamName)
    );
  });

  let rank = 0;
  for (const row of rows) {
    if (row.total !== null) row.rank = ++rank;
  }
  return rows;
}
