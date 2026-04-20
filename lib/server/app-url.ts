import type { NextRequest } from "next/server";

export function resolveAppBaseUrl(request?: NextRequest) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (request) {
    return request.nextUrl.origin.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function buildInvitationUrl(token: string, request?: NextRequest) {
  return `${resolveAppBaseUrl(request)}/convite/${encodeURIComponent(token)}`;
}

export function buildResetPasswordUrl(token: string, request?: NextRequest) {
  return `${resolveAppBaseUrl(request)}/redefinir-senha?token=${encodeURIComponent(token)}`;
}
