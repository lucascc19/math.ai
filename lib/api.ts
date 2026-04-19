import type { LoginInput, RegisterInput, SettingsInput, SubmitAnswerInput } from "@/lib/schemas";

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
    })
};

export type DashboardResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").getDashboardData>>;
export type LoginResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").loginUser>>;
export type RegisterResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").registerUser>>;
export type SettingsResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").updateAccessibilitySettings>>;
export type AnswerResponse = Awaited<ReturnType<typeof import("@/lib/server/app-data").submitAnswer>>;
