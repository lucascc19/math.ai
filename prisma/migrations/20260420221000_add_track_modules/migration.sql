-- CreateTable
CREATE TABLE "TrackModule" (
    "id" TEXT NOT NULL,
    "skillTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionMd" TEXT NOT NULL DEFAULT '',
    "estimatedMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "TrackModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackModule_skillTrackId_idx" ON "TrackModule"("skillTrackId");

-- Seed a default module for every existing track
INSERT INTO "TrackModule" ("id", "skillTrackId", "title", "orderIndex", "status")
SELECT 'module-' || "id", "id", 'Módulo 1', 0, "status"
FROM "SkillTrack";

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "trackModuleId" TEXT;

-- Backfill existing lessons to their default module
UPDATE "Lesson"
SET "trackModuleId" = 'module-' || "skillTrackId";

-- Make relation required after backfill
ALTER TABLE "Lesson" ALTER COLUMN "trackModuleId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Lesson_trackModuleId_idx" ON "Lesson"("trackModuleId");

-- AddForeignKey
ALTER TABLE "TrackModule" ADD CONSTRAINT "TrackModule_skillTrackId_fkey"
FOREIGN KEY ("skillTrackId") REFERENCES "SkillTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_trackModuleId_fkey"
FOREIGN KEY ("trackModuleId") REFERENCES "TrackModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
