import { z } from "zod";

export const roleSchema = z.enum(["STUDENT", "TUTOR", "ADMIN"]);

export const loginSchema = z.object({
  email: z.string().email("Digite um e-mail valido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

export const registerSchema = z.object({
  name: z.string().min(2, "Informe pelo menos 2 caracteres."),
  email: z.string().email("Digite um e-mail valido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

export const settingsSchema = z.object({
  fontSize: z.number().min(16).max(22),
  spacing: z.number().min(24).max(40),
  guidance: z.boolean(),
  minimal: z.boolean(),
  reducedMotion: z.boolean(),
  focusMode: z.enum(["calmo", "guiado", "contraste"])
});

export const submitAnswerSchema = z.object({
  skillId: z.string().min(1),
  lessonId: z.string().min(1),
  answer: z.coerce.number()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
