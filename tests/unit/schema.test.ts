import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema, settingsSchema, submitAnswerSchema } from "@/lib/schemas";

describe("zod schemas", () => {
  it("validates login", () => {
    const result = loginSchema.safeParse({
      email: "lucas@example.com",
      password: "segredo123"
    });

    expect(result.success).toBe(true);
  });

  it("validates register", () => {
    const result = registerSchema.safeParse({
      name: "Lucas",
      email: "lucas@example.com",
      password: "segredo123"
    });

    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({
      name: "Lucas",
      email: "lucas@example.com",
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

  it("coerces answer value", () => {
    const result = submitAnswerSchema.parse({
      skillId: "addition",
      lessonId: "addition-1",
      answer: "13"
    });

    expect(result.answer).toBe(13);
  });
});
