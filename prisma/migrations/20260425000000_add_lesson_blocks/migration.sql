-- CreateEnum
CREATE TYPE "LessonBlockType" AS ENUM ('THEORY', 'EXAMPLE', 'VISUAL', 'PRACTICE_INTRO', 'SUMMARY');

-- CreateTable
CREATE TABLE "LessonBlock" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "type" "LessonBlockType" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "contentMd" TEXT NOT NULL DEFAULT '',
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "LessonBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonBlock_lessonId_idx" ON "LessonBlock"("lessonId");

-- Backfill summary blocks for existing lessons
INSERT INTO "LessonBlock" (
    "id",
    "lessonId",
    "type",
    "title",
    "contentMd",
    "orderIndex"
)
SELECT
    'block-summary-' || "id",
    "id",
    'SUMMARY',
    'Resumo',
    "summary",
    0
FROM "Lesson"
WHERE COALESCE(NULLIF("summary", ''), '') <> '';

-- Backfill theory blocks for existing lessons
INSERT INTO "LessonBlock" (
    "id",
    "lessonId",
    "type",
    "title",
    "contentMd",
    "orderIndex"
)
SELECT
    'block-theory-' || "id",
    "id",
    'THEORY',
    'Explicacao',
    COALESCE(NULLIF("contentMd", ''), "explanation"),
    1
FROM "Lesson"
WHERE COALESCE(NULLIF("contentMd", ''), NULLIF("explanation", ''), '') <> '';

-- Backfill practice intro blocks for existing lessons
INSERT INTO "LessonBlock" (
    "id",
    "lessonId",
    "type",
    "title",
    "contentMd",
    "orderIndex"
)
SELECT
    'block-practice-' || "id",
    "id",
    'PRACTICE_INTRO',
    'Atividade',
    COALESCE(NULLIF("instructionMd", ''), "prompt"),
    2
FROM "Lesson"
WHERE COALESCE(NULLIF("instructionMd", ''), NULLIF("prompt", ''), '') <> '';

-- AddForeignKey
ALTER TABLE "LessonBlock" ADD CONSTRAINT "LessonBlock_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
