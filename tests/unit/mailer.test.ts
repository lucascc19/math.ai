import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("mailer", () => {
  const originalEnv = { ...process.env };
  const fetchMock = vi.fn();
  const logMock = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.MAIL_PROVIDER;
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_FROM_EMAIL;
    delete process.env.MAIL_FROM_NAME;
    delete process.env.RESEND_API_KEY;
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("falls back to console logging when no provider is configured", async () => {
    const { sendTransactionalEmail } = await import("@/lib/server/mailer");

    const result = await sendTransactionalEmail({
      to: "aluno@example.com",
      subject: "Teste",
      text: "Texto",
      html: "<p>Texto</p>"
    });

    expect(result).toEqual({ mode: "log" });
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining("[mailer:dev] Teste -> aluno@example.com"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends email through Resend when configured", async () => {
    process.env.MAIL_PROVIDER = "resend";
    process.env.MAIL_FROM_EMAIL = "noreply@example.com";
    process.env.MAIL_FROM_NAME = "Base Matematica";
    process.env.RESEND_API_KEY = "resend-key";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email-123" })
    });

    const { sendTransactionalEmail } = await import("@/lib/server/mailer");

    const result = await sendTransactionalEmail({
      to: "aluno@example.com",
      subject: "Teste",
      text: "Texto",
      html: "<p>Texto</p>"
    });

    expect(result).toEqual({ mode: "provider", id: "email-123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer resend-key"
        })
      })
    );
  });
});
