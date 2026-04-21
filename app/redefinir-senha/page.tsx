import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { getHomePathForRole } from "@/lib/role-home";
import { tryGetCurrentSession } from "@/lib/server/auth";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const session = await tryGetCurrentSession();

  if (session) {
    redirect(getHomePathForRole(session.user.role));
  }

  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <main className="flex min-h-screen flex-col">
      <div className="gradient-bar h-1" />
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-6">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link
            className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
            href="/login"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Link>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  );
}
