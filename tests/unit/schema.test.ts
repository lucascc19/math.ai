import { describe, expect, it } from "vitest";

import {
  acceptInvitationSchema,
  createInvitationSchema,
  loginSchema,
  settingsSchema,
  submitAnswerSchema
} from "@/lib/schemas";

describe("zod schemas", () => {
  it("validates login", () => {
    const result = loginSchema.safeParse({
      email: "lucas@example.com",
      password: "segredo123"
    });

    expect(result.success).toBe(true);
  });

  it("validates invitation creation", () => {
    const result = createInvitationSchema.safeParse({
      email: "lucas@example.com",
      role: "STUDENT",
      tutorId: "tutor-1"
    });

    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = acceptInvitationSchema.safeParse({
      name: "Lucas",
      token: "invite-token",
      password: "123"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid settings", () => {
    const result = settingsSchema.safeParse({
      fontSize: 99,
      spacing: 10,
      guidance: true,
      minimal: false,
      reducedMotion: false,
      focusMode: "inexistente"
    });

    expect(result.success).toBe(false);
  });

  it("validates submitted activity answer", () => {
    const result = submitAnswerSchema.parse({
      skillId: "addition",
      lessonId: "addition-1",
      activityId: "activity-1",
      answer: "13"
    });

    expect(result.answer).toBe("13");
  });
});
