import type {
  AcceptInvitationInput,
  CreateInvitationInput,
  LessonDraftInput,
  LessonPatchInput,
  LoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  SetRoleInput,
  SettingsInput,
  SubmitAnswerInput,
  TrackDraftInput,
  TrackPatchInput,
  TutorLinkInput
} from "@/lib/schemas";
import type { ContentStatus, Role } from "@prisma/client";
import type { InvitationStatus } from "@/lib/server/invitations";

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    let message = "Nao foi possivel concluir a requisicao.";

    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Mantem a mensagem padrao se o corpo nao vier em JSON.
    }

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  login: (input: LoginInput) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  logout: () =>
    request<{ ok: true }>("/api/auth/logout", {
      method: "POST"
    }),
  updateSettings: (input: SettingsInput) =>
    request<SettingsResponse>("/api/accessibility", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  submitAnswer: (input: SubmitAnswerInput) =>
    request<AnswerResponse>("/api/session/answer", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  logoutAll: () => request<{ ok: true }>("/api/auth/logout-all", { method: "POST" }),
  requestPasswordReset: (input: PasswordResetRequestInput) =>
    request<{ ok: true }>("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  confirmPasswordReset: (input: PasswordResetConfirmInput) =>
    request<{ ok: true }>("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  admin: {
    listUsers: (filters: { role?: Role; active?: boolean } = {}) => {
      const params = new URLSearchParams();
      if (filters.role) params.set("role", filters.role);
      if (filters.active !== undefined) params.set("active", String(filters.active));
      const query = params.toString();
      return request<{ users: AdminUser[] }>(`/api/admin/users${query ? `?${query}` : ""}`);
    },
    setUserRole: (userId: string, input: SetRoleInput) =>
      request<{ user: AdminUser }>(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    setUserActive: (userId: string, active: boolean) =>
      request<{ user: AdminUser }>(`/api/admin/users/${userId}/active`, {
        method: "PATCH",
        body: JSON.stringify({ active })
      }),
    linkTutor: (input: TutorLinkInput) =>
      request<{ link: TutorLink }>("/api/admin/tutor-links", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    unlinkTutor: (input: TutorLinkInput) =>
      request<{ ok: true }>("/api/admin/tutor-links", {
        method: "DELETE",
        body: JSON.stringify(input)
      }),
    listTutorLinks: () => request<{ links: TutorLinkFull[] }>("/api/admin/tutor-links/list"),
    listTracks: () => request<{ tracks: AdminTrack[] }>("/api/admin/content/tracks"),
    getTrack: (trackId: string) => request<{ track: AdminTrackDetail }>(`/api/admin/content/tracks/${trackId}`),
    createTrack: (input: TrackDraftInput) =>
      request<{ track: AdminTrackDetail }>("/api/admin/content/tracks", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateTrack: (trackId: string, input: TrackPatchInput) =>
      request<{ track: AdminTrackDetail }>(`/api/admin/content/tracks/${trackId}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    deleteTrack: (trackId: string) =>
      request<{ ok: true }>(`/api/admin/content/tracks/${trackId}`, { method: "DELETE" }),
    setTrackPublish: (trackId: string, publish: boolean) =>
      request<{ track: AdminTrackDetail }>(`/api/admin/content/tracks/${trackId}/publish`, {
        method: "POST",
        body: JSON.stringify({ publish })
      }),
    reorderLessons: (trackId: string, orderedIds: string[]) =>
      request<{ ok: true }>(`/api/admin/content/tracks/${trackId}/reorder`, {
        method: "POST",
        body: JSON.stringify({ orderedIds })
      }),
    createLesson: (input: LessonDraftInput) =>
      request<{ lesson: AdminLesson }>("/api/admin/content/lessons", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    updateLesson: (lessonId: string, input: LessonPatchInput) =>
      request<{ lesson: AdminLesson }>(`/api/admin/content/lessons/${lessonId}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    deleteLesson: (lessonId: string) =>
      request<{ ok: true }>(`/api/admin/content/lessons/${lessonId}`, { method: "DELETE" }),
    setLessonPublish: (lessonId: string, publish: boolean) =>
      request<{ lesson: AdminLesson }>(`/api/admin/content/lessons/${lessonId}/publish`, {
        method: "POST",
        body: JSON.stringify({ publish })
      })
  },
  tutor: {
    listStudents: () => request<{ students: AdminUser[] }>("/api/tutor/students"),
    getStudent: (studentId: string) => request<TutorStudentProgress>(`/api/tutor/students/${studentId}`),
    metrics: () => request<TutorMetrics>("/api/tutor/metrics")
  },
  invitations: {
    create: (input: CreateInvitationInput) =>
      request<{ ok: true; invitation: InvitationLinkResult }>("/api/invitations", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    list: (filters: { status?: string; role?: Role } = {}) => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.role) params.set("role", filters.role);
      const query = params.toString();
      return request<{ invitations: InvitationItem[] }>(`/api/invitations${query ? `?${query}` : ""}`);
    },
    resolve: (token: string) =>
      request<{ invitation: InvitationPublic }>(`/api/invitations/resolve?token=${encodeURIComponent(token)}`),
    accept: (input: AcceptInvitationInput) =>
      request<{ ok: true; user: { id: string; name: string; email: string; role: Role } }>(
        "/api/invitations/accept",
        { method: "POST", body: JSON.stringify(input) }
      ),
    revoke: (invitationId: string) =>
      request<{ ok: true }>(`/api/invitations/${invitationId}/revoke`, { method: "POST" }),
    delete: (invitationId: string) =>
      request<{ ok: true }>(`/api/invitations/${invitationId}`, { method: "DELETE" }),
    resend: (invitationId: string) =>
      request<{ ok: true; invitation: InvitationLinkResult }>(`/api/invitations/${invitationId}/resend`, {
        method: "POST"
      }),
    cleanup: () =>
      request<{ ok: true; deletedCount: number }>("/api/invitations", {
        method: "DELETE"
      })
  }
};

export type TutorLinkFull = {
  id: string;
  createdAt: string;
  tutor: { id: string; name: string; email: string };
  student: { id: string; name: string; email: string };
};

export type TutorStudentProgress = {
  studentId: string;
  progress: Array<{
    id: string;
    skillTrackId: string;
    lessonIndex: number;
    correct: number;
    attempts: number;
    streak: number;
    mastery: number;
    skillTrack: { id: string; slug: string; name: string };
  }>;
  totals: { attempts: number; correct: number };
};

export type TutorMetrics = {
  scope: "tutor" | "global";
  studentsTracked: number;
  attempts: number;
  correct: number;
};

export type AdminLesson = {
  id: string;
  skillTrackId: string;
  title: string;
  prompt: string;
  story: string;
  explanation: string;
  answer: number;
  level: string;
  goal: string;
  tip: string;
  orderIndex: number;
  status: ContentStatus;
};

export type AdminTrack = {
  id: string;
  slug: string;
  name: string;
  description: string;
  estimatedTime: string;
  status: ContentStatus;
  lessons: Array<{ id: string; status: ContentStatus }>;
};

export type AdminTrackDetail = Omit<AdminTrack, "lessons"> & {
  lessons: AdminLesson[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt?: string;
};

export type TutorLink = {
  id: string;
  tutorId: string;
  studentId: string;
  createdAt: string;
};

export type DashboardResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").getDashboardData>>;
export type LoginResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").loginUser>>;
export type SettingsResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").updateAccessibilitySettings>>;
export type AnswerResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").submitAnswer>>;

export type InvitationItem = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: InvitationStatus;
  invitedBy: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string } | null;
};

export type InvitationLinkResult = {
  token: string;
  email: string;
  role: Role;
  expiresAt: string;
  inviteUrl: string;
};

export type InvitationPublic = {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: InvitationStatus;
  tutor: { id: string; name: string } | null;
};
