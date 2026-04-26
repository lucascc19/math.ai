-- Enable Row Level Security for Supabase public schema tables.
-- No public policies are created here on purpose: application data must be
-- accessed through the Next.js backend using Prisma, not directly from clients.

ALTER TABLE public."AccessibilityProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LessonActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SkillTrack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TrackModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TrackProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TutorStudent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
