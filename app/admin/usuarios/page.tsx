import { Role } from "@prisma/client";
import { UsersPanel } from "@/components/admin/users-panel";
import { listUsers } from "@/lib/server/admin";

type PageProps = {
  searchParams: Promise<{ role?: string; active?: string }>;
};

function parseRole(value?: string): Role | undefined {
  return value === Role.STUDENT || value === Role.TUTOR || value === Role.ADMIN ? value : undefined;
}

function parseActive(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = parseRole(params.role);
  const active = parseActive(params.active);

  const users = await listUsers({ role, active });

  return <UsersPanel initialUsers={users} filters={{ role, active }} />;
}
