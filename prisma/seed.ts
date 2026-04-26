import { LessonActivityType, PrismaClient, Role } from "@prisma/client";

import { hashPassword, initializeUserData } from "../lib/server/auth";
import { curriculum, DEMO_USER } from "../lib/server/curriculum";

const prisma = new PrismaClient();
const prismaDb = prisma as any;

const defaultAccessibilitySettings = {
  fontSize: 16,
  spacing: 24,
  focusMode: "calmo"
} as const;

async function main() {
  for (const track of curriculum) {
    await prismaDb.skillTrack.upsert({
      where: { slug: track.slug },
      update: {
        name: track.name,
        description: track.description,
        shortDescription: track.description,
        longDescriptionMd: `## Visão geral\n\n${track.description}`,
        estimatedTime: track.estimatedTime
      },
      create: {
        slug: track.slug,
        name: track.name,
        description: track.description,
        shortDescription: track.description,
        longDescriptionMd: `## Visão geral\n\n${track.description}`,
        estimatedTime: track.estimatedTime
      }
    });

    const dbTrack = await prismaDb.skillTrack.findUniqueOrThrow({
      where: { slug: track.slug }
    });

    const defaultModule = await prismaDb.trackModule.upsert({
      where: { id: `module-${dbTrack.id}` },
      update: {
        skillTrackId: dbTrack.id,
        title: "Módulo 1",
        orderIndex: 0,
        status: dbTrack.status
      },
      create: {
        id: `module-${dbTrack.id}`,
        skillTrackId: dbTrack.id,
        title: "Módulo 1",
        orderIndex: 0,
        status: dbTrack.status
      }
    });

    for (const [index, lesson] of track.lessons.entries()) {
      await prismaDb.lesson.upsert({
        where: { id: lesson.id },
        update: {
          skillTrackId: dbTrack.id,
          trackModuleId: defaultModule.id,
          title: lesson.title,
          summary: lesson.story,
          contentMd: lesson.explanation,
          instructionMd: lesson.prompt,
          prompt: lesson.prompt,
          story: lesson.story,
          explanation: lesson.explanation,
          answer: lesson.answer,
          level: lesson.level,
          goal: lesson.goal,
          tip: lesson.tip,
          orderIndex: index
        },
        create: {
          id: lesson.id,
          skillTrackId: dbTrack.id,
          trackModuleId: defaultModule.id,
          title: lesson.title,
          summary: lesson.story,
          contentMd: lesson.explanation,
          instructionMd: lesson.prompt,
          prompt: lesson.prompt,
          story: lesson.story,
          explanation: lesson.explanation,
          answer: lesson.answer,
          level: lesson.level,
          goal: lesson.goal,
          tip: lesson.tip,
          orderIndex: index
        }
      });

      await prismaDb.lessonActivity.upsert({
        where: { id: `activity-${lesson.id}` },
        update: {
          lessonId: lesson.id,
          type: LessonActivityType.NUMERIC,
          instructionMd: lesson.prompt,
          answerKey: String(lesson.answer),
          optionsJson: "[]",
          hintMd: lesson.tip,
          feedbackCorrectMd: lesson.explanation,
          feedbackIncorrectMd: lesson.explanation,
          orderIndex: 0
        },
        create: {
          id: `activity-${lesson.id}`,
          lessonId: lesson.id,
          type: LessonActivityType.NUMERIC,
          instructionMd: lesson.prompt,
          answerKey: String(lesson.answer),
          optionsJson: "[]",
          hintMd: lesson.tip,
          feedbackCorrectMd: lesson.explanation,
          feedbackIncorrectMd: lesson.explanation,
          orderIndex: 0
        }
      });

      await prismaDb.lessonBlock.deleteMany({
        where: { lessonId: lesson.id }
      });

      await prismaDb.lessonBlock.createMany({
        data: [
          {
            lessonId: lesson.id,
            type: "SUMMARY",
            title: "Resumo",
            contentMd: lesson.story,
            orderIndex: 0
          },
          {
            lessonId: lesson.id,
            type: "THEORY",
            title: "Explicacao",
            contentMd: lesson.explanation,
            orderIndex: 1
          },
          {
            lessonId: lesson.id,
            type: "PRACTICE_INTRO",
            title: "Atividade",
            contentMd: lesson.prompt,
            orderIndex: 2
          }
        ]
      });
    }
  }

  const user = await prismaDb.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      name: DEMO_USER.name,
      role: Role.STUDENT,
      passwordHash: hashPassword("demo12345")
    },
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      role: Role.STUDENT,
      passwordHash: hashPassword("demo12345")
    }
  });

  await prismaDb.accessibilityProfile.upsert({
    where: { userId: user.id },
    update: { ...defaultAccessibilitySettings },
    create: {
      ...defaultAccessibilitySettings,
      userId: user.id
    }
  });

  await initializeUserData(user.id);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@basematematica.dev";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const admin = await prismaDb.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, active: true },
    create: {
      name: adminName,
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash: hashPassword(adminPassword)
    }
  });

  await initializeUserData(admin.id);

  console.log("Seed concluído com sucesso.");
  console.log(`Aluno demo: ${DEMO_USER.email} / demo12345`);
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
