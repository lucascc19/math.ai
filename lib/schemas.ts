import { z } from "zod";

export const roleSchema = z.enum(["STUDENT", "TUTOR", "ADMIN"]);

export const loginSchema = z.object({
  email: z.string().email("Digite um e-mail valido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

export const settingsSchema = z.object({
  fontSize: z.number().min(16).max(22),
  spacing: z.number().min(24).max(40),
  focusMode: z.enum(["calmo", "guiado", "contraste"])
});

export const submitAnswerSchema = z.object({
  skillId: z.string().min(1),
  lessonId: z.string().min(1),
  answer: z.coerce.number()
});

export const setRoleSchema = z.object({
  role: roleSchema
});

export const tutorLinkSchema = z.object({
  tutorId: z.string().min(1),
  studentId: z.string().min(1)
});

export const lessonDraftSchema = z.object({
  skillTrackId: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  story: z.string().min(1),
  explanation: z.string().min(1),
  answer: z.coerce.number().int(),
  level: z.string().min(1),
  goal: z.string().min(1),
  tip: z.string().min(1),
  orderIndex: z.coerce.number().int().nonnegative()
});

export const lessonPatchSchema = lessonDraftSchema.partial();

export const trackDraftSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedTime: z.string().min(1)
});

export const trackPatchSchema = trackDraftSchema.partial();

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Digite um e-mail valido.")
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SetRoleInput = z.infer<typeof setRoleSchema>;
export type TutorLinkInput = z.infer<typeof tutorLinkSchema>;
export type LessonDraftInput = z.infer<typeof lessonDraftSchema>;
export type LessonPatchInput = z.infer<typeof lessonPatchSchema>;
export type TrackDraftInput = z.infer<typeof trackDraftSchema>;
export type TrackPatchInput = z.infer<typeof trackPatchSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

export const invitationRoleSchema = z.enum(["STUDENT", "TUTOR", "ADMIN"]);

export const createInvitationSchema = z.object({
  email: z.string().email("Digite um e-mail válido."),
  role: invitationRoleSchema,
  name: z.string().min(2).optional(),
  tutorId: z.string().optional()
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Informe pelo menos 2 caracteres."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.")
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
