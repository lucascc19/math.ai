-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('EXPLANATION', 'PRACTICE', 'QUIZ', 'REVIEW');

-- AlterTable
ALTER TABLE "SkillTrack"
ADD COLUMN "shortDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN "longDescriptionMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT '',
ADD COLUMN "targetAudience" TEXT NOT NULL DEFAULT '',
ADD COLUMN "learningOutcomesMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN "prerequisiteSummaryMd" TEXT NOT NULL DEFAULT '';

UPDATE "SkillTrack"
SET "shortDescription" = "description"
WHERE "shortDescription" = '';

-- AlterTable
ALTER TABLE "Lesson"
ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "contentMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN "instructionMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN "teacherNotesMd" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lessonType" "LessonType" NOT NULL DEFAULT 'PRACTICE',
ADD COLUMN "estimatedMinutes" INTEGER;

UPDATE "Lesson"
SET
  "summary" = "story",
  "contentMd" = "explanation",
  "instructionMd" = "prompt"
WHERE "summary" = ''
   OR "contentMd" = ''
   OR "instructionMd" = '';
