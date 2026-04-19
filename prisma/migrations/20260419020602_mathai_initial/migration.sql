-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TUTOR', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessibilityProfile" (
    "id" TEXT NOT NULL,
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "spacing" INTEGER NOT NULL DEFAULT 24,
    "guidance" BOOLEAN NOT NULL DEFAULT false,
    "minimal" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "focusMode" TEXT NOT NULL DEFAULT 'calmo',
    "userId" TEXT NOT NULL,

    CONSTRAINT "AccessibilityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTrack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedTime" TEXT NOT NULL,

    CONSTRAINT "SkillTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "skillTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillTrackId" TEXT NOT NULL,
    "lessonIndex" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "mastery" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrackProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AccessibilityProfile_userId_key" ON "AccessibilityProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTrack_slug_key" ON "SkillTrack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TrackProgress_userId_skillTrackId_key" ON "TrackProgress"("userId", "skillTrackId");

-- AddForeignKey
ALTER TABLE "AccessibilityProfile" ADD CONSTRAINT "AccessibilityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_skillTrackId_fkey" FOREIGN KEY ("skillTrackId") REFERENCES "SkillTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProgress" ADD CONSTRAINT "TrackProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackProgress" ADD CONSTRAINT "TrackProgress_skillTrackId_fkey" FOREIGN KEY ("skillTrackId") REFERENCES "SkillTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
