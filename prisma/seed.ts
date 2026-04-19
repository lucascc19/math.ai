import { PrismaClient, Role } from "@prisma/client";
import { hashPassword, initializeUserData } from "../lib/server/auth";
import { curriculum, defaultSettings, DEMO_USER } from "../lib/server/curriculum";

const prisma = new PrismaClient();
const prismaDb = prisma as any;

async function main() {
  for (const track of curriculum) {
    await prismaDb.skillTrack.upsert({
      where: { slug: track.slug },
      update: {
        name: track.name,
        description: track.description,
        estimatedTime: track.estimatedTime
      },
      create: {
        slug: track.slug,
        name: track.name,
        description: track.description,
        estimatedTime: track.estimatedTime
      }
    });

    const dbTrack = await prismaDb.skillTrack.findUniqueOrThrow({
      where: { slug: track.slug }
    });

    for (const [index, lesson] of track.lessons.entries()) {
      await prismaDb.lesson.upsert({
        where: { id: lesson.id },
        update: {
          skillTrackId: dbTrack.id,
          title: lesson.title,
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
          title: lesson.title,
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
    update: { ...defaultSettings },
    create: {
      ...defaultSettings,
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
