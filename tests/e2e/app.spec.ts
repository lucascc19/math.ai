import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, Role } from "@prisma/client";

import { generateOpaqueToken, hashToken } from "../../lib/server/token-hash";

const prisma = new PrismaClient();

async function loginAsAdmin(page: Page) {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@basematematica.dev" }
  });
  const token = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: admin.id,
      expiresAt
    }
  });

  await page.context().addCookies([
    {
      name: "mathai_session",
      value: token,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(expiresAt.getTime() / 1000)
    }
  ]);

  await page.goto("/admin/convites");
  await expect(page.getByRole("heading", { name: "Gerenciar convites" })).toBeVisible();
}

async function createInvitationRecord(params: {
  token: string;
  email: string;
  role?: Role;
  expiresAt: Date;
  revokedAt?: Date | null;
  usedAt?: Date | null;
}) {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@basematematica.dev" }
  });

  await prisma.user.deleteMany({
    where: { email: params.email }
  });

  await prisma.invitation.deleteMany({
    where: { email: params.email }
  });

  await prisma.invitation.create({
    data: {
      email: params.email,
      role: params.role ?? Role.STUDENT,
      tokenHash: hashToken(params.token),
      invitedByUserId: admin.id,
      expiresAt: params.expiresAt,
      revokedAt: params.revokedAt ?? null,
      usedAt: params.usedAt ?? null
    }
  });
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("landing routes to login and authenticated dashboard flow works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Login", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Entrar na plataforma" })).toBeVisible();
  await page.getByPlaceholder("E-mail").fill("aluno@basematematica.dev");
  await page.getByPlaceholder("Senha").fill("demo12345");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
});

test("admin creates invitation and invited user accepts then logs in", async ({ page, browser }) => {
  const inviteeEmail = `invitee-${Date.now()}@example.com`;
  const inviteePassword = "convite12345";
  const inviteeName = "Aluno Convite";

  await loginAsAdmin(page);
  await page.getByRole("button", { name: "Novo convite" }).click();
  await page.getByPlaceholder("E-mail do convidado").fill(inviteeEmail);
  await page.getByRole("button", { name: "Gerar convite" }).click();

  await expect(page.getByText(`Convite gerado para ${inviteeEmail}`)).toBeVisible();
  const inviteUrl = await page.locator("code").first().textContent();
  expect(inviteUrl).toBeTruthy();

  const invitedContext = await browser.newContext();
  const invitedPage = await invitedContext.newPage();

  await invitedPage.goto(inviteUrl!);
  await expect(invitedPage.getByRole("heading", { name: "Ativar sua conta" })).toBeVisible();
  await invitedPage.getByPlaceholder("Seu nome completo").fill(inviteeName);
  await invitedPage.getByPlaceholder("Escolha uma senha").fill(inviteePassword);
  await invitedPage.getByRole("button", { name: "Ativar conta" }).click();

  await invitedPage.waitForURL("**/dashboard");
  await expect(invitedPage.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await invitedPage.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(invitedPage.getByRole("heading", { name: "Entrar na plataforma" })).toBeVisible();

  await invitedPage.getByPlaceholder("E-mail").fill(inviteeEmail);
  await invitedPage.getByPlaceholder("Senha").fill(inviteePassword);
  await invitedPage.getByRole("button", { name: "Entrar" }).click();

  await invitedPage.waitForURL("**/dashboard");
  await expect(invitedPage.getByRole("button", { name: "Sair", exact: true })).toBeVisible();
  await invitedContext.close();
});

test("revoked invitation shows revoked state in UI", async ({ page }) => {
  const token = `revoked-token-${Date.now()}`;
  const email = `revoked-${Date.now()}@example.com`;

  await createInvitationRecord({
    token,
    email,
    revokedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await page.goto(`/convite/${token}`);

  await expect(page.getByText("Convite revogado")).toBeVisible();
});

test("expired invitation shows expired state in UI", async ({ page }) => {
  const token = `expired-token-${Date.now()}`;
  const email = `expired-${Date.now()}@example.com`;

  await createInvitationRecord({
    token,
    email,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  });

  await page.goto(`/convite/${token}`);

  await expect(page.getByText("Convite expirado")).toBeVisible();
});
