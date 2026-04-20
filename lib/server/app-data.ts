import { Role } from "@prisma/client";
import { calculateAccuracy, updateProgress } from "@/lib/domain/progress";
import { defaultSettings, getLessonMeta, getTrackMeta } from "@/lib/server/curriculum";
import { createSession, initializeUserData, setSessionCookie, verifyPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import type { LoginInput, SettingsInput, SubmitAnswerInput } from "@/lib/schemas";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export type LoginResult = Awaited<ReturnType<typeof loginUser>>;
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
    tutorSnapshot: null,
    adminSnapshot: null
  };
}

async function getAdminSnapshot() {
  const [totalUsers, totalTutors, totalStudents, activeUsers, publishedTracks, draftTracks, publishedLessons, draftLessons, tutorLinks] =
    await Promise.all([
      prismaDb.user.count(),
      prismaDb.user.count({ where: { role: Role.TUTOR } }),
      prismaDb.user.count({ where: { role: Role.STUDENT } }),
      prismaDb.user.count({ where: { active: true } }),
      prismaDb.skillTrack.count({ where: { status: "PUBLISHED" } }),
      prismaDb.skillTrack.count({ where: { status: "DRAFT" } }),
      prismaDb.lesson.count({ where: { status: "PUBLISHED" } }),
      prismaDb.lesson.count({ where: { status: "DRAFT" } }),
      prismaDb.tutorStudent.count()
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
    tutorLinks
  };
}

async function getTutorSnapshot(tutorId: string) {
  const links = await prismaDb.tutorStudent.findMany({
    where: { tutorId },
    select: {
      studentId: true,
      student: { select: { id: true, name: true, email: true, active: true } }
    }
  });
  const studentIds = links.map((link: any) => link.studentId);

  if (studentIds.length === 0) {
    return {
      studentsTracked: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      studentsAtRisk: 0,
      recentStudents: []
    };
  }

  const [totalAttempts, totalCorrect, atRiskAttemptsByStudent] = await Promise.all([
    prismaDb.attempt.count({ where: { userId: { in: studentIds } } }),
    prismaDb.attempt.count({ where: { userId: { in: studentIds }, isCorrect: true } }),
    prismaDb.attempt.groupBy({
      by: ["userId"],
      where: { userId: { in: studentIds } },
      _count: { _all: true }
    })
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
    recentStudents: links.slice(0, 5).map((link: any) => link.student)
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
    where: { status: "PUBLISHED" },
    include: {
      lessons: {
        where: { status: "PUBLISHED" },
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

  const tutorSnapshot = user.role === Role.TUTOR ? await getTutorSnapshot(user.id) : null;
  const adminSnapshot = user.role === Role.ADMIN ? await getAdminSnapshot() : null;

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
    tutorSnapshot,
    adminSnapshot
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
    throw new Error("E-mail ou senha inválidos.");
  }

  if (user.active === false) {
    throw new Error("Conta desativada. Entre em contato com a coordenação.");
  }

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
