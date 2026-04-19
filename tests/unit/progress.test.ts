import { describe, expect, it } from "vitest";
import { calculateAccuracy, updateProgress } from "@/lib/domain/progress";

describe("progress domain", () => {
  it("increments mastery and advances when streak is enough", () => {
    const next = updateProgress(
      { attempts: 1, correct: 1, streak: 1, mastery: 43, lessonIndex: 0 },
      true,
      3
    );

    expect(next.correct).toBe(2);
    expect(next.lessonIndex).toBe(1);
    expect(next.streak).toBe(0);
  });

  it("reduces mastery on error", () => {
    const next = updateProgress(
      { attempts: 2, correct: 1, streak: 1, mastery: 30, lessonIndex: 1 },
      false,
      3
    );

    expect(next.mastery).toBe(25);
    expect(next.lessonIndex).toBe(1);
  });

  it("calculates accuracy safely", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
    expect(calculateAccuracy(3, 4)).toBe(75);
  });
});
