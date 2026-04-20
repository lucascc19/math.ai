import type {
  CreateTutorInput,
  LoginInput,
  RegisterInput,
  SetRoleInput,
  SettingsInput,
  SubmitAnswerInput,
  TutorLinkInput
} from "@/lib/schemas";
import type { Role } from "@prisma/client";

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
  register: (input: RegisterInput) =>
    request<RegisterResponse>("/api/auth/register", {
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
  admin: {
    listUsers: (filters: { role?: Role; active?: boolean } = {}) => {
      const params = new URLSearchParams();
      if (filters.role) params.set("role", filters.role);
      if (filters.active !== undefined) params.set("active", String(filters.active));
      const query = params.toString();
      return request<{ users: AdminUser[] }>(`/api/admin/users${query ? `?${query}` : ""}`);
    },
    createTutor: (input: CreateTutorInput) =>
      request<{ tutor: AdminUser }>("/api/admin/tutors", {
        method: "POST",
        body: JSON.stringify(input)
      }),
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
    listTutorLinks: () => request<{ links: TutorLinkFull[] }>("/api/admin/tutor-links/list")
  },
  tutor: {
    listStudents: () => request<{ students: AdminUser[] }>("/api/tutor/students"),
    getStudent: (studentId: string) => request<TutorStudentProgress>(`/api/tutor/students/${studentId}`),
    metrics: () => request<TutorMetrics>("/api/tutor/metrics")
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
export type RegisterResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").registerUser>>;
export type SettingsResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").updateAccessibilitySettings>>;
export type AnswerResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").submitAnswer>>;
