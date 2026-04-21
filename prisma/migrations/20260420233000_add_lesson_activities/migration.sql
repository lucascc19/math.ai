-- CreateEnum
CREATE TYPE "LessonActivityType" AS ENUM ('NUMERIC', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_TEXT');

-- CreateTable
CREATE TABLE "LessonActivity" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LessonActivityType" NOT NULL,
    "instructionMd" TEXT NOT NULL DEFAULT '',
    "answerKey" TEXT NOT NULL,
    "optionsJson" TEXT NOT NULL DEFAULT '[]',
    "hintMd" TEXT NOT NULL DEFAULT '',
    "feedbackCorrectMd" TEXT NOT NULL DEFAULT '',
    "feedbackIncorrectMd" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "LessonActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonActivity_lessonId_idx" ON "LessonActivity"("lessonId");

-- Seed a default numeric activity for every existing lesson
INSERT INTO "LessonActivity" (
    "id",
    "lessonId",
    "type",
    "instructionMd",
    "answerKey",
    "hintMd",
    "feedbackCorrectMd",
    "feedbackIncorrectMd",
    "orderIndex"
)
SELECT
    'activity-' || "id",
    "id",
    'NUMERIC',
    COALESCE(NULLIF("instructionMd", ''), "prompt"),
    CAST("answer" AS TEXT),
    "tip",
    "explanation",
    "explanation",
    0
FROM "Lesson";

-- AlterTable
ALTER TABLE "Attempt" ALTER COLUMN "answer" TYPE TEXT USING CAST("answer" AS TEXT);
ALTER TABLE "Attempt" ADD COLUMN "activityId" TEXT;

-- Backfill attempts to the default activity for each lesson
UPDATE "Attempt"
SET "activityId" = 'activity-' || "lessonId";

-- Make relation required after backfill
ALTER TABLE "Attempt" ALTER COLUMN "activityId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "LessonActivity" ADD CONSTRAINT "LessonActivity_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "LessonActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
