import { expect, test } from "@playwright/test";

test("landing routes to login and authenticated dashboard flow works", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Matematica basica adaptativa para alunos com TDAH e TEA.")).toBeVisible();
  await page.getByRole("link", { name: "Login" }).click();

  await expect(page.getByRole("heading", { name: "Entrar na plataforma" })).toBeVisible();
  await page.getByPlaceholder("E-mail").fill("aluno@basematematica.dev");
  await page.getByPlaceholder("Senha").fill("demo12345");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Painel principal")).toBeVisible();
  await page.getByPlaceholder("Digite sua resposta").fill("13");
  await page.getByRole("button", { name: "Verificar resposta" }).click();
  await expect(page.getByText(/Resposta correta/)).toBeVisible();
});
