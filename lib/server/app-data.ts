import { Role } from "@prisma/client";
import { calculateAccuracy, updateProgress } from "@/lib/domain/progress";
import { defaultSettings, getLessonMeta, getTrackMeta } from "@/lib/server/curriculum";
import { createSession, hashPassword, initializeUserData, setSessionCookie, verifyPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import type { LoginInput, RegisterInput, SettingsInput, SubmitAnswerInput } from "@/lib/schemas";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export type LoginResult = Awaited<ReturnType<typeof loginUser>>;
export type RegisterResult = Awaited<ReturnType<typeof registerUser>>;
export type SettingsResult = Awaited<ReturnType<typeof updateAccessibilitySettings>>;
export type SubmitAnswerResult = Awaited<ReturnType<typeof submitAnswer>>;

const prismaDb = prisma as any;

function normalizeSettings(
  settings?:
    | {
        fontSize: number;
        spacing: number;
        guidance: boolean;
        minimal: boolean;
        reducedMotion: boolean;
        focusMode: string;
      }
    | null
) {
  return {
    fontSize: settings?.fontSize ?? defaultSettings.fontSize,
    spacing: settings?.spacing ?? defaultSettings.spacing,
    guidance: settings?.guidance ?? defaultSettings.guidance,
    minimal: settings?.minimal ?? defaultSettings.minimal,
    reducedMotion: settings?.reducedMotion ?? defaultSettings.reducedMotion,
    focusMode: (settings?.focusMode as SettingsInput["focusMode"] | undefined) ?? defaultSettings.focusMode
  };
}

function emptyDashboardData() {
  return {
    isAuthenticated: false as const,
    user: null,
    settings: normalizeSettings(),
    stats: {
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
      activeTracks: 0
    },
    skills: [],
    tutor: {
      studentsTracked: 18,
      studentsAtRisk: 5,
      topDifficulty: "Divisao",
      averageWeeklySessions: 3
    },
    admin: {
      publishedTracks: 0,
      totalLessons: 0,
      pendingReviews: 2
    }
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
      role: user.role
    }
  };
}

export async function getDashboardData(userId?: string | null) {
  if (!userId) {
    return emptyDashboardData();
  }

  const user = await prismaDb.user.findUnique({
    where: { id: userId },
    include: {
      accessibility: true
    }
  });

  if (!user) {
    return emptyDashboardData();
  }

  await initializeUserData(user.id);

  const dbTracks = await prismaDb.skillTrack.findMany({
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" }
      },
      progress: {
        where: { userId: user.id }
      }
    },
    orderBy: { name: "asc" }
  });

  const skills = dbTracks
    .filter((track: any) => track.lessons.length > 0)
    .map((track: any) => {
      const meta = getTrackMeta(track.slug);
      const progress = track.progress[0] ?? {
        lessonIndex: 0,
        correct: 0,
        attempts: 0,
        streak: 0,
        mastery: 0
      };
      const currentLessonDb = track.lessons[Math.min(progress.lessonIndex, track.lessons.length - 1)];
      const currentLessonMeta = getLessonMeta(currentLessonDb.id);

      return {
        id: track.slug,
        name: track.name,
        short: meta?.short ?? track.name,
        estimatedTime: track.estimatedTime,
        description: track.description,
        accent: meta?.accent ?? "primary",
        progress: {
          lessonIndex: progress.lessonIndex,
          correct: progress.correct,
          attempts: progress.attempts,
          streak: progress.streak,
          mastery: progress.mastery
        },
        accuracy: calculateAccuracy(progress.correct, progress.attempts),
        currentLesson: {
          id: currentLessonDb.id,
          title: currentLessonDb.title,
          prompt: currentLessonDb.prompt,
          story: currentLessonDb.story,
          explanation: currentLessonDb.explanation,
          answer: currentLessonDb.answer,
          level: currentLessonDb.level,
          goal: currentLessonDb.goal,
          tip: currentLessonDb.tip,
          guidance: currentLessonMeta?.lesson.guidance ?? []
        }
      };
    });

  const totalAttempts = skills.reduce((sum: number, skill: any) => sum + skill.progress.attempts, 0);
  const totalCorrect = skills.reduce((sum: number, skill: any) => sum + skill.progress.correct, 0);

  return {
    isAuthenticated: true as const,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    settings: normalizeSettings(user.accessibility),
    stats: {
      totalAttempts,
      totalCorrect,
      accuracy: calculateAccuracy(totalCorrect, totalAttempts),
      activeTracks: skills.length
    },
    skills,
    tutor: {
      studentsTracked: 18,
      studentsAtRisk: 5,
      topDifficulty: "Divisao",
      averageWeeklySessions: 3
    },
    admin: {
      publishedTracks: skills.length,
      totalLessons: dbTracks.reduce((sum: number, track: any) => sum + track.lessons.length, 0),
      pendingReviews: 2
    }
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prismaDb.user.findUnique({
    where: { email: input.email },
    include: {
      accessibility: true
    }
  });

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("E-mail ou senha invalidos.");
  }

  return createAuthenticatedResponse(user);
}

export async function registerUser(input: RegisterInput) {
  const existingUser = await prismaDb.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new Error("Ja existe uma conta com este e-mail.");
  }

  const user = await prismaDb.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: Role.STUDENT,
      passwordHash: hashPassword(input.password),
      accessibility: {
        create: { ...defaultSettings }
      }
    },
    include: {
      accessibility: true
    }
  });

  return createAuthenticatedResponse(user);
}

export async function updateAccessibilitySettings(userId: string, input: SettingsInput) {
  await initializeUserData(userId);

  const settings = await prismaDb.accessibilityProfile.upsert({
    where: { userId },
    update: input,
    create: {
      ...input,
      userId
    }
  });

  return {
    ok: true,
    settings: normalizeSettings(settings)
  };
}

export async function submitAnswer(userId: string, input: SubmitAnswerInput) {
  await initializeUserData(userId);

  const track = await prismaDb.skillTrack.findUnique({
    where: { slug: input.skillId },
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (!track) {
    throw new Error("Trilha nao encontrada.");
  }

  const lesson = track.lessons.find((item: any) => item.id === input.lessonId);

  if (!lesson) {
    throw new Error("Licao nao encontrada.");
  }

  const progress = await prismaDb.trackProgress.upsert({
    where: {
      userId_skillTrackId: {
        userId,
        skillTrackId: track.id
      }
    },
    update: {},
    create: {
      userId,
      skillTrackId: track.id
    }
  });

  const nextProgress = updateProgress(
    {
      lessonIndex: progress.lessonIndex,
      correct: progress.correct,
      attempts: progress.attempts,
      streak: progress.streak,
      mastery: progress.mastery
    },
    input.answer === lesson.answer,
    track.lessons.length
  );

  const isCorrect = input.answer === lesson.answer;

  await prismaDb.$transaction([
    prismaDb.attempt.create({
      data: {
        userId,
        lessonId: lesson.id,
        answer: input.answer,
        isCorrect
      }
    }),
    prismaDb.trackProgress.update({
      where: { id: progress.id },
      data: nextProgress
    })
  ]);

  const nextLesson = track.lessons[Math.min(nextProgress.lessonIndex, track.lessons.length - 1)];
  const nextLessonMeta = getLessonMeta(nextLesson.id);

  return {
    ok: true,
    result: {
      isCorrect,
      correctAnswer: lesson.answer,
      explanation: lesson.explanation
    },
    progress: nextProgress,
    nextLesson: {
      id: nextLesson.id,
      title: nextLesson.title,
      prompt: nextLesson.prompt,
      story: nextLesson.story,
      explanation: nextLesson.explanation,
      answer: nextLesson.answer,
      level: nextLesson.level,
      goal: nextLesson.goal,
      tip: nextLesson.tip,
      guidance: nextLessonMeta?.lesson.guidance ?? []
    },
    accuracy: calculateAccuracy(nextProgress.correct, nextProgress.attempts)
  };
}
