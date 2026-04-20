"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type AdminUser, type TutorLinkFull } from "@/lib/api";

type Props = {
  initialLinks: TutorLinkFull[];
  tutors: AdminUser[];
  students: AdminUser[];
};

export function LinksPanel({ initialLinks, tutors, students }: Props) {
  const queryClient = useQueryClient();
  const [tutorId, setTutorId] = useState(tutors[0]?.id ?? "");
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");

  const { data: links = initialLinks } = useQuery({
    queryKey: ["admin", "tutor-links"],
    queryFn: () => api.admin.listTutorLinks().then((r) => r.links),
    initialData: initialLinks
  });

  const linkMutation = useMutation({
    mutationFn: () => api.admin.linkTutor({ tutorId, studentId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tutor-links"] })
  });

  const unlinkMutation = useMutation({
    mutationFn: (params: { tutorId: string; studentId: string }) => api.admin.unlinkTutor(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tutor-links"] })
  });

  const canLink = tutorId && studentId && !linkMutation.isPending;

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
          Associar tutores aos alunos
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-neutral-10/70 dark:text-neutral-80">
          Cada tutor vê apenas os alunos que estão vinculados a ele. Um aluno pode ter múltiplos tutores.
        </p>
      </div>

      <Card className="grid gap-4 rounded-2xl border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
        <Badge variant="primary">Novo vínculo</Badge>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <SelectField label="Tutor" value={tutorId} onChange={setTutorId} options={tutors} />
          <SelectField label="Aluno" value={studentId} onChange={setStudentId} options={students} />
          <Button className="h-fit" onClick={() => linkMutation.mutate()} disabled={!canLink}>
            <Link2 className="mr-2 h-4 w-4" />
            {linkMutation.isPending ? "Vinculando..." : "Vincular"}
          </Button>
        </div>
        {linkMutation.error && (
          <p className="text-sm text-tertiary-30 dark:text-tertiary-70">{linkMutation.error.message}</p>
        )}
      </Card>

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Vínculos existentes</h2>
          <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
            {links.length} {links.length === 1 ? "vínculo" : "vínculos"}
          </span>
        </div>

        <div className="grid gap-3">
          {links.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum vínculo cadastrado ainda.
            </p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/50"
              >
                <div className="grid flex-1 gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-primary-40 dark:text-primary-70">
                    Tutor
                  </span>
                  <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">
                    {link.tutor.name}
                  </span>
                  <span className="text-xs text-neutral-10/65 dark:text-neutral-80">{link.tutor.email}</span>
                </div>
                <Link2 className="h-4 w-4 text-neutral-10/45 dark:text-neutral-70" />
                <div className="grid flex-1 gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-secondary-40 dark:text-secondary-70">
                    Aluno
                  </span>
                  <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">
                    {link.student.name}
                  </span>
                  <span className="text-xs text-neutral-10/65 dark:text-neutral-80">{link.student.email}</span>
                </div>
                <button
                  type="button"
                  disabled={unlinkMutation.isPending}
                  onClick={() =>
                    unlinkMutation.mutate({ tutorId: link.tutor.id, studentId: link.student.id })
                  }
                  className="h-fit focus-ring inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-tertiary-30/40 hover:text-tertiary-30 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95 dark:hover:border-tertiary-70/50 dark:hover:text-tertiary-70"
                >
                  <Trash2 className="h-3 w-3" />
                  Desvincular
                </button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: AdminUser[];
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-neutral-10/70 dark:text-neutral-80">{label}</span>
      <Select value={value || "__none__"} onValueChange={(nextValue) => onChange(nextValue === "__none__" ? "" : nextValue)}>
        <SelectTrigger>
          <SelectValue placeholder={options.length === 0 ? "Nenhum disponivel" : `Selecione ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__none__">Nenhum disponivel</SelectItem>
          ) : (
            options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.name} - {opt.email}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </label>
  );
}
