import { ContentStatus } from "@prisma/client";

import type {
  LessonActivityDraftInput,
  ModuleDraftInput,
  ModulePatchInput,
  LessonDraftInput,
  LessonPatchInput,
  TrackDraftInput,
  TrackPatchInput
} from "@/lib/schemas";
import {
  assertCanEditLesson,
  assertCanEditTrack,
  NotFoundError,
  requireActor
} from "@/lib/server/permissions";
import { prisma } from "@/lib/server/prisma";

const prismaDb = prisma as any;

function serializeActivityOptions(activity: LessonActivityDraftInput) {
  if (activity.type !== "MULTIPLE_CHOICE") {
    return "[]";
  }

  return JSON.stringify(
    activity.choiceOptionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean)
  );
}

async function normalizeLessonOrderIndices(db: any, moduleId: string) {
  const lessons = await db.lesson.findMany({
    where: { trackModuleId: moduleId },
    orderBy: [{ orderIndex: "asc" }, { id: "asc" }],
    select: { id: true }
  });

  await Promise.all(
    lessons.map((lesson: { id: string }, index: number) =>
      db.lesson.update({
        where: { id: lesson.id },
        data: { orderIndex: index }
      })
    )
  );
}

async function ensureDefaultModule(trackId: string) {
  const existing = await prismaDb.trackModule.findFirst({
    where: { skillTrackId: trackId },
    orderBy: { orderIndex: "asc" }
  });

  if (existing) return existing;

  return prismaDb.trackModule.create({
    data: {
      skillTrackId: trackId,
      title: "Módulo 1",
      orderIndex: 0,
      status: ContentStatus.DRAFT
    }
  });
}

export async function listTracksForAdmin() {
  await requireActor("track.draft.edit");

  return prismaDb.skillTrack.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      shortDescription: true,
      longDescriptionMd: true,
      estimatedTime: true,
      difficulty: true,
      targetAudience: true,
      learningOutcomesMd: true,
      prerequisiteSummaryMd: true,
      status: true,
      lessons: {
        select: { id: true, status: true }
      }
    }
  });
}

export async function getTrackWithLessons(trackId: string) {
  await requireActor("track.draft.edit");

  await ensureDefaultModule(trackId);

  const track = await prismaDb.skillTrack.findUnique({
    where: { id: trackId },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: {
              activities: { orderBy: { orderIndex: "asc" } }
            }
          }
        }
      }
    }
  });

  if (!track) throw new NotFoundError("Trilha não encontrada.");
  return track;
}

export async function createDraftTrack(input: TrackDraftInput) {
  await requireActor("track.draft.create");

  const track = await prismaDb.skillTrack.create({
    data: {
      ...input,
      shortDescription: input.shortDescription || input.description,
      status: ContentStatus.DRAFT
    }
  });

  await prismaDb.trackModule.create({
    data: {
      skillTrackId: track.id,
      title: "Módulo 1",
      orderIndex: 0,
      status: ContentStatus.DRAFT
    }
  });

  return getTrackWithLessons(track.id);
}

export async function updateTrack(trackId: string, patch: TrackPatchInput) {
  const actor = await requireActor("track.draft.edit");
  await assertCanEditTrack(actor, trackId);

  return prismaDb.skillTrack.update({
    where: { id: trackId },
    data: {
      ...patch,
      shortDescription:
        patch.shortDescription !== undefined
          ? patch.shortDescription || patch.description || ""
          : patch.description !== undefined
            ? patch.description
            : undefined
    }
  });
}

export async function createTrackModule(input: ModuleDraftInput) {
  const actor = await requireActor("track.draft.edit");
  await assertCanEditTrack(actor, input.skillTrackId);

  return prismaDb.trackModule.create({
    data: {
      ...input,
      status: ContentStatus.DRAFT
    }
  });
}

export async function reorderTrackModules(trackId: string, orderedIds: string[]) {
  await requireActor("track.draft.edit");

  await prismaDb.$transaction(
    orderedIds.map((id, index) =>
      prismaDb.trackModule.update({
        where: { id },
        data: { orderIndex: index, skillTrackId: trackId }
      })
    )
  );

  return { ok: true };
}

export async function updateTrackModule(moduleId: string, patch: ModulePatchInput) {
  await requireActor("track.draft.edit");

  return prismaDb.trackModule.update({
    where: { id: moduleId },
    data: patch
  });
}

export async function deleteTrackModule(moduleId: string) {
  await requireActor("track.draft.edit");

  const module = await prismaDb.trackModule.findUnique({
    where: { id: moduleId },
    include: { lessons: true }
  });

  if (!module) throw new NotFoundError("Módulo não encontrado.");
  if (module.lessons.length > 0) {
    throw new Error("Exclua ou mova as lições do módulo antes de removê-lo.");
  }

  await prismaDb.trackModule.delete({ where: { id: moduleId } });
  return { ok: true };
}

export async function publishTrack(trackId: string) {
  await requireActor("track.publish");
  return prismaDb.skillTrack.update({
    where: { id: trackId },
    data: { status: ContentStatus.PUBLISHED }
  });
}

export async function unpublishTrack(trackId: string) {
  await requireActor("track.unpublish");
  return prismaDb.skillTrack.update({
    where: { id: trackId },
    data: { status: ContentStatus.DRAFT }
  });
}

export async function deleteTrack(trackId: string) {
  await requireActor("track.delete");
  await prismaDb.skillTrack.delete({ where: { id: trackId } });
  return { ok: true };
}

export async function createDraftLesson(input: LessonDraftInput) {
  await requireActor("lesson.draft.create");

  const module = await prismaDb.trackModule.findUnique({
    where: { id: input.trackModuleId },
    select: { skillTrackId: true }
  });

  if (!module) throw new NotFoundError("Módulo não encontrado.");

  const lesson = await prismaDb.lesson.create({
    data: {
      trackModuleId: input.trackModuleId,
      title: input.title,
      summary: input.summary,
      contentMd: input.contentMd,
      instructionMd: input.instructionMd,
      teacherNotesMd: input.teacherNotesMd,
      lessonType: input.lessonType,
      estimatedMinutes: input.estimatedMinutes,
      prompt: input.prompt,
      story: input.story,
      explanation: input.explanation,
      answer: input.answer,
      level: input.level,
      goal: input.goal,
      tip: input.tip,
      orderIndex: input.orderIndex,
      skillTrackId: module.skillTrackId,
      status: ContentStatus.DRAFT,
      activities: {
        create: input.activities.map((activity) => ({
          type: activity.type,
          instructionMd: activity.instructionMd,
          answerKey: activity.answerKey,
          optionsJson: serializeActivityOptions(activity),
          hintMd: activity.hintMd,
          feedbackCorrectMd: activity.feedbackCorrectMd,
          feedbackIncorrectMd: activity.feedbackIncorrectMd,
          orderIndex: activity.orderIndex
        }))
      }
    },
    include: {
      activities: { orderBy: { orderIndex: "asc" } }
    }
  });

  await normalizeLessonOrderIndices(prismaDb, input.trackModuleId);

  return lesson;
}

export async function updateLesson(lessonId: string, patch: LessonPatchInput) {
  const actor = await requireActor("lesson.draft.edit");
  await assertCanEditLesson(actor, lessonId);

  const existingLesson = await prismaDb.lesson.findUnique({
    where: { id: lessonId },
    select: { trackModuleId: true }
  });

  if (!existingLesson) throw new NotFoundError("Lição não encontrada.");

  return prismaDb.$transaction(async (tx: any) => {
    const data: Record<string, unknown> = { ...patch };
    const targetModuleId = patch.trackModuleId ?? existingLesson.trackModuleId;

    delete data.activities;

    if (patch.trackModuleId) {
      const module = await tx.trackModule.findUnique({
        where: { id: patch.trackModuleId },
        select: { skillTrackId: true }
      });

      if (!module) throw new NotFoundError("Módulo não encontrado.");
      data.skillTrackId = module.skillTrackId;
    }

    if (targetModuleId !== existingLesson.trackModuleId && patch.orderIndex === undefined) {
      const targetCount = await tx.lesson.count({
        where: { trackModuleId: targetModuleId }
      });
      data.orderIndex = targetCount;
    }

    const updatedLesson = await tx.lesson.update({
      where: { id: lessonId },
      data,
      include: {
        activities: { orderBy: { orderIndex: "asc" } }
      }
    });

    if (patch.activities) {
      await tx.lessonActivity.deleteMany({
        where: { lessonId }
      });

      if (patch.activities.length > 0) {
        await tx.lessonActivity.createMany({
          data: patch.activities.map((activity) => ({
            lessonId,
            type: activity.type,
            instructionMd: activity.instructionMd,
            answerKey: activity.answerKey,
            optionsJson: serializeActivityOptions(activity),
            hintMd: activity.hintMd,
            feedbackCorrectMd: activity.feedbackCorrectMd,
            feedbackIncorrectMd: activity.feedbackIncorrectMd,
            orderIndex: activity.orderIndex
          }))
        });
      }
    }

    await normalizeLessonOrderIndices(tx, existingLesson.trackModuleId);
    if (targetModuleId !== existingLesson.trackModuleId) {
      await normalizeLessonOrderIndices(tx, targetModuleId);
    }

    return tx.lesson.findUnique({
      where: { id: updatedLesson.id },
      include: {
        activities: { orderBy: { orderIndex: "asc" } }
      }
    });
  });
}

export async function publishLesson(lessonId: string) {
  await requireActor("lesson.publish");
  return prismaDb.lesson.update({
    where: { id: lessonId },
    data: { status: ContentStatus.PUBLISHED }
  });
}

export async function unpublishLesson(lessonId: string) {
  await requireActor("lesson.unpublish");
  return prismaDb.lesson.update({
    where: { id: lessonId },
    data: { status: ContentStatus.DRAFT }
  });
}

export async function reorderModuleLessons(moduleId: string, orderedIds: string[]) {
  await requireActor("lesson.reorder");

  await prismaDb.$transaction(
    orderedIds.map((id, index) =>
      prismaDb.lesson.update({
        where: { id },
        data: { orderIndex: index, trackModuleId: moduleId }
      })
    )
  );

  return { ok: true };
}

export async function deleteLesson(lessonId: string) {
  await requireActor("lesson.delete");

  const lesson = await prismaDb.lesson.findUnique({
    where: { id: lessonId },
    select: { trackModuleId: true }
  });

  if (!lesson) throw new NotFoundError("Lição não encontrada.");

  await prismaDb.$transaction(async (tx: any) => {
    await tx.lesson.delete({ where: { id: lessonId } });
    await normalizeLessonOrderIndices(tx, lesson.trackModuleId);
  });

  return { ok: true };
}
