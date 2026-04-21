import { Role } from "@prisma/client";

import { normalizeAccessibilitySettings } from "@/lib/accessibility-settings";
import { calculateAccuracy, updateProgress } from "@/lib/domain/progress";
import type {
  LoginInput,
  SettingsInput,
  SubmitAnswerInput,
} from "@/lib/schemas";
import {
  createSession,
  initializeUserData,
  setSessionCookie,
  verifyPassword,
} from "@/lib/server/auth";
import { getLessonMeta, getTrackMeta } from "@/lib/server/curriculum";
import { prisma } from "@/lib/server/prisma";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export type LoginResult = Awaited<ReturnType<typeof loginUser>>;
export type SettingsResult = Awaited<
  ReturnType<typeof updateAccessibilitySettings>
>;
export type SubmitAnswerResult = Awaited<ReturnType<typeof submitAnswer>>;

const prismaDb = prisma as any;

function parseActivityOptions(optionsJson: string) {
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function getPrimaryActivity(lesson: any) {
  return [...(lesson.activities ?? [])].sort((a: any, b: any) => a.orderIndex - b.orderIndex)[0] ?? null;
}

function evaluateActivityAnswer(activity: any, rawAnswer: string) {
  const answer = rawAnswer.trim();
  const expected = String(activity.answerKey ?? "").trim();

  if (activity.type === "NUMERIC") {
    const normalizedInput = Number(answer.replace(",", "."));
    const normalizedExpected = Number(expected.replace(",", "."));
    if (Number.isNaN(normalizedInput) || Number.isNaN(normalizedExpected)) {
      return false;
    }
    return normalizedInput === normalizedExpected;
  }

  if (activity.type === "TRUE_FALSE") {
    const normalizeBooleanAnswer = (value: string) => {
      const normalized = value.trim().toLowerCase();
      if (["true", "verdadeiro", "v", "sim"].includes(normalized)) return "true";
      if (["false", "falso", "f", "nao", "não"].includes(normalized)) return "false";
      return normalized;
    };

    return normalizeBooleanAnswer(answer) === normalizeBooleanAnswer(expected);
  }

  const normalizeTextAnswer = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  if (activity.type === "SHORT_TEXT") {
    return normalizeTextAnswer(answer) === normalizeTextAnswer(expected);
  }

  return answer.localeCompare(expected, "pt-BR", { sensitivity: "accent" }) === 0;
}

function flattenTrackLessons(track: any) {
  return (track.modules ?? [])
    .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    .flatMap((module: any) =>
      (module.lessons ?? [])
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
        .map((lesson: any) => ({
          ...lesson,
          module: {
            id: module.id,
            title: module.title,
            descriptionMd: module.descriptionMd,
            orderIndex: module.orderIndex,
            estimatedMinutes: module.estimatedMinutes
          }
        }))
    );
}

function emptyDashboardData() {
  return {
    isAuthenticated: false as const,
    user: null,
    settings: normalizeAccessibilitySettings(),
    stats: {
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
      activeTracks: 0,
    },
    skills: [],
    tutorSnapshot: null,
    adminSnapshot: null,
  };
}

async function getAdminSnapshot() {
  const [
    totalUsers,
    totalTutors,
    totalStudents,
    activeUsers,
    publishedTracks,
    draftTracks,
    publishedLessons,
    draftLessons,
    tutorLinks,
  ] = await Promise.all([
    prismaDb.user.count(),
    prismaDb.user.count({ where: { role: Role.TUTOR } }),
    prismaDb.user.count({ where: { role: Role.STUDENT } }),
    prismaDb.user.count({ where: { active: true } }),
    prismaDb.skillTrack.count({ where: { status: "PUBLISHED" } }),
    prismaDb.skillTrack.count({ where: { status: "DRAFT" } }),
    prismaDb.lesson.count({ where: { status: "PUBLISHED" } }),
    prismaDb.lesson.count({ where: { status: "DRAFT" } }),
    prismaDb.tutorStudent.count(),
  ]);

  return {
    totalUsers,
    totalTutors,
    totalStudents,
    activeUsers,
    publishedTracks,
    draftTracks,
    publishedLessons,
    draftLessons,
    tutorLinks,
  };
}

async function getTutorSnapshot(tutorId: string) {
  const links = await prismaDb.tutorStudent.findMany({
    where: { tutorId },
    select: {
      studentId: true,
      student: { select: { id: true, name: true, email: true, active: true } },
    },
  });
  const studentIds = links.map((link: any) => link.studentId);

  if (studentIds.length === 0) {
    return {
      studentsTracked: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      studentsAtRisk: 0,
      recentStudents: [],
    };
  }

  const [totalAttempts, totalCorrect, atRiskAttemptsByStudent] =
    await Promise.all([
      prismaDb.attempt.count({ where: { userId: { in: studentIds } } }),
      prismaDb.attempt.count({
        where: { userId: { in: studentIds }, isCorrect: true },
      }),
      prismaDb.attempt.groupBy({
        by: ["userId"],
        where: { userId: { in: studentIds } },
        _count: { _all: true },
      }),
    ]);

  const studentsAtRisk = studentIds.filter((id: string) => {
    const row = atRiskAttemptsByStudent.find((r: any) => r.userId === id);
    return !row || row._count._all < 3;
  }).length;

  return {
    studentsTracked: studentIds.length,
    totalAttempts,
    totalCorrect,
    studentsAtRisk,
    recentStudents: links.slice(0, 5).map((link: any) => link.student),
  };
}

async function createAuthenticatedResponse(user: any) {
  await initializeUserData(user.id);
  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getDashboardData(userId?: string | null) {
  if (!userId) {
    return emptyDashboardData();
  }

  const user = await prismaDb.user.findUnique({
    where: { id: userId },
    include: {
      accessibility: true,
    },
  });

  if (!user) {
    return emptyDashboardData();
  }

  await initializeUserData(user.id);

  const dbTracks = await prismaDb.skillTrack.findMany({
    where: { status: "PUBLISHED" },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { orderIndex: "asc" },
            include: {
              activities: { orderBy: { orderIndex: "asc" } }
            }
          }
        }
      },
      progress: {
        where: { userId: user.id },
      },
    },
    orderBy: { name: "asc" },
  });

  const skills = dbTracks
    .filter((track: any) => flattenTrackLessons(track).length > 0)
    .map((track: any) => {
      const meta = getTrackMeta(track.slug);
      const orderedLessons = flattenTrackLessons(track);
      const progress = track.progress[0] ?? {
        lessonIndex: 0,
        correct: 0,
        attempts: 0,
        streak: 0,
        mastery: 0,
      };
      const currentLessonDb =
        orderedLessons[Math.min(progress.lessonIndex, orderedLessons.length - 1)];
      const currentLessonMeta = getLessonMeta(currentLessonDb.id);
      const currentActivity = getPrimaryActivity(currentLessonDb);

      return {
        id: track.slug,
        name: track.name,
        short: track.shortDescription || meta?.short || track.name,
        estimatedTime: track.estimatedTime,
        description: track.shortDescription || track.description,
        longDescriptionMd: track.longDescriptionMd,
        difficulty: track.difficulty,
        targetAudience: track.targetAudience,
        learningOutcomesMd: track.learningOutcomesMd,
        prerequisiteSummaryMd: track.prerequisiteSummaryMd,
        accent: meta?.accent ?? "primary",
        progress: {
          lessonIndex: progress.lessonIndex,
          correct: progress.correct,
          attempts: progress.attempts,
          streak: progress.streak,
          mastery: progress.mastery,
        },
        accuracy: calculateAccuracy(progress.correct, progress.attempts),
        modules: track.modules
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
          .map((module: any) => ({
            id: module.id,
            title: module.title,
            descriptionMd: module.descriptionMd,
            orderIndex: module.orderIndex,
            estimatedMinutes: module.estimatedMinutes,
            lessons: module.lessons
              .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
              .map((lesson: any) => {
                const activity = getPrimaryActivity(lesson);

                return {
                  id: lesson.id,
                  title: lesson.title,
                  summary: lesson.summary,
                  orderIndex: lesson.orderIndex,
                  lessonType: lesson.lessonType,
                  contentMd: lesson.contentMd,
                  instructionMd: lesson.instructionMd,
                  estimatedMinutes: lesson.estimatedMinutes,
                  prompt: lesson.prompt,
                  story: lesson.story,
                  explanation: lesson.explanation,
                  level: lesson.level,
                  goal: lesson.goal,
                  activity: activity
                    ? {
                        id: activity.id,
                        type: activity.type,
                        instructionMd: activity.instructionMd,
                        hintMd: activity.hintMd,
                        feedbackCorrectMd: activity.feedbackCorrectMd,
                        feedbackIncorrectMd: activity.feedbackIncorrectMd,
                        options: parseActivityOptions(activity.optionsJson)
                      }
                    : null,
                  isCurrent: lesson.id === currentLessonDb.id
                };
              })
          })),
        currentLesson: {
          id: currentLessonDb.id,
          moduleId: currentLessonDb.module.id,
          moduleTitle: currentLessonDb.module.title,
          title: currentLessonDb.title,
          summary: currentLessonDb.summary,
          contentMd: currentLessonDb.contentMd,
          instructionMd: currentLessonDb.instructionMd,
          teacherNotesMd: currentLessonDb.teacherNotesMd,
          lessonType: currentLessonDb.lessonType,
          estimatedMinutes: currentLessonDb.estimatedMinutes,
          prompt: currentLessonDb.prompt,
          story: currentLessonDb.story,
          explanation: currentLessonDb.explanation,
          answer: currentLessonDb.answer,
          level: currentLessonDb.level,
          goal: currentLessonDb.goal,
          tip: currentLessonDb.tip,
          activity: currentActivity
            ? {
                id: currentActivity.id,
                type: currentActivity.type,
                instructionMd: currentActivity.instructionMd,
                hintMd: currentActivity.hintMd,
                feedbackCorrectMd: currentActivity.feedbackCorrectMd,
                feedbackIncorrectMd: currentActivity.feedbackIncorrectMd,
                options: parseActivityOptions(currentActivity.optionsJson)
              }
            : null,
          guidance: currentLessonMeta?.lesson.guidance ?? [],
        },
      };
    });

  const totalAttempts = skills.reduce(
    (sum: number, skill: any) => sum + skill.progress.attempts,
    0,
  );
  const totalCorrect = skills.reduce(
    (sum: number, skill: any) => sum + skill.progress.correct,
    0,
  );

  const tutorSnapshot =
    user.role === Role.TUTOR ? await getTutorSnapshot(user.id) : null;
  const adminSnapshot =
    user.role === Role.ADMIN ? await getAdminSnapshot() : null;

  return {
    isAuthenticated: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    settings: normalizeAccessibilitySettings(user.accessibility),
    stats: {
      totalAttempts,
      totalCorrect,
      accuracy: calculateAccuracy(totalCorrect, totalAttempts),
      activeTracks: skills.length,
    },
    skills,
    tutorSnapshot,
    adminSnapshot,
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prismaDb.user.findUnique({
    where: { email: input.email },
    include: {
      accessibility: true,
    },
  });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("E-mail ou senha inválidos.");
  }

  if (user.active === false) {
    throw new Error("Conta desativada. Entre em contato com a coordenação.");
  }

  return createAuthenticatedResponse(user);
}

export async function updateAccessibilitySettings(
  userId: string,
  input: SettingsInput,
) {
  await initializeUserData(userId);

  const settings = await prismaDb.accessibilityProfile.upsert({
    where: { userId },
    update: input,
    create: {
      ...input,
      userId,
    },
  });

  return {
    ok: true,
    settings: normalizeAccessibilitySettings(settings),
  };
}

export async function submitAnswer(userId: string, input: SubmitAnswerInput) {
  await initializeUserData(userId);

  const track = await prismaDb.skillTrack.findUnique({
    where: { slug: input.skillId },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { orderIndex: "asc" },
            include: {
              activities: { orderBy: { orderIndex: "asc" } }
            }
          }
        }
      },
    },
  });

  if (!track) {
    throw new Error("Trilha não encontrada.");
  }

  const orderedLessons = flattenTrackLessons(track);
  const lesson = orderedLessons.find((item: any) => item.id === input.lessonId);
  const activity = lesson ? getPrimaryActivity(lesson) : null;

  if (!lesson) {
    throw new Error("Lição não encontrada.");
  }

  if (!activity || activity.id !== input.activityId) {
    throw new Error("Atividade não encontrada.");
  }

  const progress = await prismaDb.trackProgress.upsert({
    where: {
      userId_skillTrackId: {
        userId,
        skillTrackId: track.id,
      },
    },
    update: {},
    create: {
      userId,
      skillTrackId: track.id,
    },
  });

  const nextProgress = updateProgress(
    {
      lessonIndex: progress.lessonIndex,
      correct: progress.correct,
      attempts: progress.attempts,
      streak: progress.streak,
      mastery: progress.mastery,
    },
    evaluateActivityAnswer(activity, input.answer),
    orderedLessons.length,
  );

  const isCorrect = evaluateActivityAnswer(activity, input.answer);

  await prismaDb.$transaction([
    prismaDb.attempt.create({
      data: {
        userId,
        lessonId: lesson.id,
        activityId: activity.id,
        answer: input.answer,
        isCorrect,
      },
    }),
    prismaDb.trackProgress.update({
      where: { id: progress.id },
      data: nextProgress,
    }),
  ]);

  const nextLesson = orderedLessons[Math.min(nextProgress.lessonIndex, orderedLessons.length - 1)];
  const nextLessonMeta = getLessonMeta(nextLesson.id);
  const nextActivity = getPrimaryActivity(nextLesson);

  return {
    ok: true,
    result: {
      isCorrect,
      correctAnswer: activity.answerKey,
      explanation: isCorrect
        ? activity.feedbackCorrectMd || lesson.explanation
        : activity.feedbackIncorrectMd || lesson.explanation,
    },
    progress: nextProgress,
    nextLesson: {
      id: nextLesson.id,
      moduleId: nextLesson.module.id,
      moduleTitle: nextLesson.module.title,
      title: nextLesson.title,
      summary: nextLesson.summary,
      contentMd: nextLesson.contentMd,
      instructionMd: nextLesson.instructionMd,
      teacherNotesMd: nextLesson.teacherNotesMd,
      lessonType: nextLesson.lessonType,
      estimatedMinutes: nextLesson.estimatedMinutes,
      prompt: nextLesson.prompt,
      story: nextLesson.story,
      explanation: nextLesson.explanation,
      answer: nextLesson.answer,
      level: nextLesson.level,
      goal: nextLesson.goal,
      tip: nextLesson.tip,
      activity: nextActivity
        ? {
            id: nextActivity.id,
            type: nextActivity.type,
            instructionMd: nextActivity.instructionMd,
            hintMd: nextActivity.hintMd,
            feedbackCorrectMd: nextActivity.feedbackCorrectMd,
            feedbackIncorrectMd: nextActivity.feedbackIncorrectMd,
            options: parseActivityOptions(nextActivity.optionsJson)
          }
        : null,
      guidance: nextLessonMeta?.lesson.guidance ?? [],
    },
    accuracy: calculateAccuracy(nextProgress.correct, nextProgress.attempts),
  };
}
