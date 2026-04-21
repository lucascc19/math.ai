import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { sendTransactionalEmail } from "../lib/server/mailer";

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf-8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env"));
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const to = process.argv[2];

  if (!to) {
    throw new Error("Uso: pnpm mail:test <email-destino>");
  }

  const result = await sendTransactionalEmail({
    to,
    subject: "Teste de envio - Base Matemática",
    text: "Este e um teste de envio do ambiente local.",
    html: "<p>Este e um teste de envio do ambiente local.</p>"
  });

  console.log(`Envio concluido em modo: ${result.mode}${result.id ? ` (id: ${result.id})` : ""}`);
}

main().catch((error) => {
  console.error("Falha ao testar envio de e-mail.");
  console.error(error);
  process.exit(1);
});
