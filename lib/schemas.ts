import { z } from "zod";

const optionalNumberField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}, z.coerce.number().int().positive().optional());

export const roleSchema = z.enum(["STUDENT", "TUTOR", "ADMIN"]);
export const lessonTypeSchema = z.enum(["EXPLANATION", "PRACTICE", "QUIZ", "REVIEW"]);
export const lessonActivityTypeSchema = z.enum(["NUMERIC", "MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_TEXT"]);

export const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido."),
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
  activityId: z.string().min(1),
  answer: z.string().trim().min(1)
});

export const setRoleSchema = z.object({
  role: roleSchema
});

export const tutorLinkSchema = z.object({
  tutorId: z.string().min(1),
  studentId: z.string().min(1)
});

export const moduleDraftSchema = z.object({
  skillTrackId: z.string().min(1),
  title: z.string().min(1),
  descriptionMd: z.string().default(""),
  estimatedMinutes: optionalNumberField,
  orderIndex: z.coerce.number().int().nonnegative()
});

export const modulePatchSchema = moduleDraftSchema.partial();

export const lessonActivityDraftSchema = z.object({
  type: lessonActivityTypeSchema.default("NUMERIC"),
  instructionMd: z.string().default(""),
  answerKey: z.string().trim().min(1, "Informe a resposta esperada da atividade."),
  choiceOptionsText: z.string().default(""),
  hintMd: z.string().default(""),
  feedbackCorrectMd: z.string().default(""),
  feedbackIncorrectMd: z.string().default(""),
  orderIndex: z.coerce.number().int().nonnegative().default(0)
}).superRefine((activity, ctx) => {
  if (activity.type === "MULTIPLE_CHOICE") {
    const options = activity.choiceOptionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["choiceOptionsText"],
        message: "Informe ao menos duas opcoes, uma por linha."
      });
    }

    if (!options.includes(activity.answerKey.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerKey"],
        message: "A resposta correta precisa corresponder exatamente a uma das opcoes."
      });
    }
  }

  if (activity.type === "TRUE_FALSE") {
    const normalizedAnswer = activity.answerKey.trim().toLowerCase();
    const validAnswers = ["true", "false", "verdadeiro", "falso"];

    if (!validAnswers.includes(normalizedAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["answerKey"],
        message: "Use verdadeiro/falso ou true/false como resposta correta."
      });
    }
  }

  if (activity.type === "SHORT_TEXT" && activity.answerKey.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["answerKey"],
      message: "Informe uma resposta textual com pelo menos 2 caracteres."
    });
  }
});

export const lessonDraftSchema = z.object({
  trackModuleId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().default(""),
  contentMd: z.string().default(""),
  instructionMd: z.string().default(""),
  teacherNotesMd: z.string().default(""),
  lessonType: lessonTypeSchema.default("PRACTICE"),
  estimatedMinutes: optionalNumberField,
  prompt: z.string().min(1),
  story: z.string().min(1),
  explanation: z.string().min(1),
  answer: z.coerce.number().int(),
  level: z.string().min(1),
  goal: z.string().min(1),
  tip: z.string().min(1),
  orderIndex: z.coerce.number().int().nonnegative(),
  activities: z.array(lessonActivityDraftSchema).min(1, "Adicione ao menos uma atividade.")
});

export const lessonPatchSchema = lessonDraftSchema.partial();

export const trackDraftSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().default(""),
  longDescriptionMd: z.string().default(""),
  estimatedTime: z.string().min(1),
  difficulty: z.string().default(""),
  targetAudience: z.string().default(""),
  learningOutcomesMd: z.string().default(""),
  prerequisiteSummaryMd: z.string().default("")
});

export const trackPatchSchema = trackDraftSchema.partial();

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Digite um e-mail válido.")
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
export type ModuleDraftInput = z.infer<typeof moduleDraftSchema>;
export type ModulePatchInput = z.infer<typeof modulePatchSchema>;
export type LessonActivityDraftInput = z.infer<typeof lessonActivityDraftSchema>;
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
