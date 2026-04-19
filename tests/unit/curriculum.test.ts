import { describe, expect, it } from "vitest";
import { curriculum, getLessonMeta, getTrackMeta } from "@/lib/server/curriculum";

describe("curriculum metadata", () => {
  it("exposes the configured tracks", () => {
    expect(curriculum).toHaveLength(4);
    expect(getTrackMeta("addition")?.name).toBe("Adição");
  });

  it("finds lesson guidance by lesson id", () => {
    const lessonMeta = getLessonMeta("division-2");

    expect(lessonMeta?.track.slug).toBe("division");
    expect(lessonMeta?.lesson.guidance.length).toBeGreaterThan(0);
  });
});
