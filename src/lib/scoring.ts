export const SCORE_CATEGORIES = [
  { key: 'valuePracticality', label: 'Value & Practicality', weight: 0.3 },
  { key: 'creativity', label: 'Creativity & Differentiation', weight: 0.3 },
  { key: 'aiTechnical', label: 'AI Application & Technical Quality', weight: 0.2 },
  { key: 'completenessUx', label: 'Product Completeness & UX', weight: 0.1 },
  { key: 'responsibleAi', label: 'Feasibility & Responsible AI', weight: 0.1 },
] as const;

export type ScoreValues = {
  valuePracticality: number;
  creativity: number;
  aiTechnical: number;
  completenessUx: number;
  responsibleAi: number;
};

export function weightedScore(score: ScoreValues) {
  return SCORE_CATEGORIES.reduce((total, category) => total + score[category.key] * category.weight, 0);
}

export function scorePercentage(score: ScoreValues) {
  return weightedScore(score) * 20;
}
