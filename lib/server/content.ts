import { ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  assertCanEditLesson,
  assertCanEditTrack,
  requireActor
} from "@/lib/server/permissions";
import type {
  LessonDraftInput,
  LessonPatchInput,
  TrackDraftInput,
  TrackPatchInput
} from "@/lib/schemas";

const prismaDb = prisma as any;

export async function createDraftTrack(input: TrackDraftInput) {
  await requireActor("track.draft.create");

  return prismaDb.skillTrack.create({
    data: { ...input, status: ContentStatus.DRAFT }
  });
}

export async function updateTrack(trackId: string, patch: TrackPatchInput) {
  const actor = await requireActor("track.draft.edit");
  await assertCanEditTrack(actor, trackId);

  return prismaDb.skillTrack.update({ where: { id: trackId }, data: patch });
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

  return prismaDb.lesson.create({
    data: { ...input, status: ContentStatus.DRAFT }
  });
}

export async function updateLesson(lessonId: string, patch: LessonPatchInput) {
  const actor = await requireActor("lesson.draft.edit");
  await assertCanEditLesson(actor, lessonId);

  return prismaDb.lesson.update({ where: { id: lessonId }, data: patch });
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

export async function reorderLessons(trackId: string, orderedIds: string[]) {
  await requireActor("lesson.reorder");

  await prismaDb.$transaction(
    orderedIds.map((id, index) =>
      prismaDb.lesson.update({
        where: { id },
        data: { orderIndex: index, skillTrackId: trackId }
      })
    )
  );

  return { ok: true };
}

export async function deleteLesson(lessonId: string) {
  await requireActor("lesson.delete");
  await prismaDb.lesson.delete({ where: { id: lessonId } });
  return { ok: true };
}
