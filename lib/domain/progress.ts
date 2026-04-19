export type ProgressState = {
  lessonIndex: number;
  correct: number;
  attempts: number;
  streak: number;
  mastery: number;
};

export function updateProgress(
  current: ProgressState,
  isCorrect: boolean,
  totalLessons: number
): ProgressState {
  const next = { ...current, attempts: current.attempts + 1 };

  if (isCorrect) {
    next.correct += 1;
    next.streak += 1;
    next.mastery = Math.min(100, next.mastery + 17);
  } else {
    next.streak = 0;
    next.mastery = Math.max(0, next.mastery - 5);
  }

  const canAdvance = next.lessonIndex < totalLessons - 1;
  const shouldAdvance = canAdvance && (next.streak >= 2 || next.mastery >= 60);

  if (shouldAdvance) {
    next.lessonIndex += 1;
    next.streak = 0;
  }

  return next;
}

export function calculateAccuracy(correct: number, attempts: number) {
  if (!attempts) {
    return 0;
  }

  return Math.round((correct / attempts) * 100);
}
