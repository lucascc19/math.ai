type MailDelivery = {
  id?: string;
  mode: "provider" | "log";
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type PasswordResetMailInput = {
  email: string;
  resetUrl: string;
  expiresAt: Date;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatExpiresAt(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function getFromAddress() {
  const explicitFrom = process.env.MAIL_FROM?.trim();
  if (explicitFrom) return explicitFrom;

  const fromEmail = process.env.MAIL_FROM_EMAIL?.trim();
  if (!fromEmail) return null;

  const fromName = process.env.MAIL_FROM_NAME?.trim() || "Base Matematica";
  return `${fromName} <${fromEmail}>`;
}

async function sendWithResend(input: SendMailInput, apiKey: string, from: string): Promise<MailDelivery> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar e-mail via Resend (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { id?: string };
  return { mode: "provider", id: payload.id };
}

export async function sendTransactionalEmail(input: SendMailInput): Promise<MailDelivery> {
  const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase();
  const from = getFromAddress();

  if (!provider) {
    console.log(`[mailer:dev] ${input.subject} -> ${input.to}\n${input.text}`);
    return { mode: "log" };
  }

  if (!from) {
    throw new Error("MAIL_FROM, MAIL_FROM_EMAIL ou MAIL_FROM_NAME precisa estar configurado para envio real.");
  }

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("RESEND_API_KEY nao configurada.");
    }

    return sendWithResend(input, apiKey, from);
  }

  throw new Error(`Provedor de e-mail nao suportado: ${provider}`);
}

export async function sendPasswordResetEmail(input: PasswordResetMailInput) {
  const expiresAt = formatExpiresAt(input.expiresAt);
  const escapedUrl = escapeHtml(input.resetUrl);

  return sendTransactionalEmail({
    to: input.email,
    subject: "Recuperacao de senha - Base Matematica",
    text: [
      "Recebemos um pedido para redefinir sua senha.",
      `Use este link para continuar: ${input.resetUrl}`,
      `Esse link expira em ${expiresAt}.`,
      "Se voce nao pediu a redefinicao, ignore este e-mail."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h1 style="font-size: 20px; margin-bottom: 16px;">Recuperacao de senha</h1>
        <p>Recebemos um pedido para redefinir sua senha.</p>
        <p>
          <a href="${escapedUrl}" style="display: inline-block; padding: 10px 16px; background: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Redefinir senha
          </a>
        </p>
        <p>Se preferir, copie e cole este link no navegador:</p>
        <p><a href="${escapedUrl}">${escapedUrl}</a></p>
        <p>Esse link expira em ${escapeHtml(expiresAt)}.</p>
        <p>Se voce nao pediu a redefinicao, ignore este e-mail.</p>
      </div>
    `
  });
}
