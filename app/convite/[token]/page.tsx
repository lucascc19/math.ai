import Link from "next/link";

import { InvitationAcceptForm } from "@/components/invitation-accept-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInvitationByToken } from "@/lib/server/invitations";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConvitePage({ params }: PageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  return (
    <main className="flex min-h-screen flex-col">
      <div className="gradient-bar h-1" />
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-6">
        <div className="flex w-full max-w-md flex-col gap-6">
          {!invitation && <InvalidInvitationCard reason="not-found" />}
          {invitation?.status === "used" && (
            <InvalidInvitationCard reason="used" />
          )}
          {invitation?.status === "revoked" && (
            <InvalidInvitationCard reason="revoked" />
          )}
          {invitation?.status === "expired" && (
            <InvalidInvitationCard reason="expired" />
          )}
          {invitation?.status === "pending" && (
            <InvitationAcceptForm token={token} invitation={invitation} />
          )}
        </div>
      </div>
    </main>
  );
}

function InvalidInvitationCard({
  reason,
}: {
  reason: "not-found" | "used" | "revoked" | "expired";
}) {
  const messages: Record<typeof reason, { title: string; body: string }> = {
    "not-found": {
      title: "Convite não encontrado",
      body: "Este link de convite não é válido. Verifique se você copiou o endereço completo.",
    },
    used: {
      title: "Convite já utilizado",
      body: "Este convite já foi aceito e a conta foi criada. Acesse a plataforma pelo login.",
    },
    revoked: {
      title: "Convite revogado",
      body: "Este convite foi cancelado. Entre em contato com quem te convidou para receber um novo link.",
    },
    expired: {
      title: "Convite expirado",
      body: "Este convite expirou após 3 dias. Entre em contato com quem te convidou para receber um novo link.",
    },
  };

  const { title, body } = messages[reason];

  return (
    <Card className="grid gap-4 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft">
      <div className="grid gap-2">
        <Badge variant="secondary">Convite inválido</Badge>
        <h1 className="text-2xl font-bold text-neutral-10">{title}</h1>
        <p className="text-sm leading-7 text-neutral-10/75">{body}</p>
      </div>
      <Link
        href="/login"
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline"
      >
        Ir para o login
      </Link>
    </Card>
  );
}
