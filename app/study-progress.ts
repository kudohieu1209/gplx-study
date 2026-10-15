export type QuestionProgress = {
  attempts: number;
  correct: number;
  streak: number;
  mastered: boolean;
  lastSeen: number;
  nextReview: number;
  lastAnswer?: number;
};

export function restoreChapterAnswers(
  questions: readonly { id: number; correctAnswer: number }[],
  progress: Record<number, QuestionProgress>,
): Record<number, number> {
  const answers: Record<number, number> = {};
  for (const question of questions) {
    const saved = progress[question.id];
    if (!saved?.attempts) continue;
    // Older progress records did not store the selected answer. A positive
    // streak identifies a correct last answer; otherwise leave it unknown.
    const answer = saved.lastAnswer
      ?? (saved.streak ? question.correctAnswer : undefined);
    if (answer !== undefined) answers[question.id] = answer;
  }
  return answers;
}
