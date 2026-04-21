"use client";

import { useMutation } from "@tanstack/react-query";
import { Accessibility, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { SettingsInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function applyAccessibilitySettings(settings: SettingsInput) {
  document.documentElement.style.setProperty("--reading-size", `${settings.fontSize / 16}rem`);
  document.documentElement.style.setProperty("--reading-gap", `${settings.spacing}px`);
  document.body.classList.remove("focus-calmo", "focus-guiado", "focus-contraste");
  document.body.classList.add(`focus-${settings.focusMode}`);
}

export function AccessibilityFab({
  initialSettings,
  onSettingsChange
}: {
  initialSettings: SettingsInput;
  onSettingsChange?: (settings: SettingsInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (response) => {
      setSettings(response.settings);
      onSettingsChange?.(response.settings);
    }
  });

  function update<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    onSettingsChange?.(next);
  }

  function save() {
    mutation.mutate(settings);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setOpen(false)}
          aria-label="Fechar painel de acessibilidade"
        />
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <div className="w-[min(92vw,360px)] rounded-2xl border border-black/8 bg-white p-4 shadow-[0_20px_60px_rgba(24,39,75,0.16)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary-40">Acessibilidade</span>
                <h2 className="text-lg font-bold text-neutral-10">Leitura e foco</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/6 bg-white text-neutral-10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4">
              <RangeControl
                label="Tamanho do texto"
                value={settings.fontSize}
                min={16}
                max={22}
                step={1}
                suffix="px"
                onChange={(value) => update("fontSize", Number(value))}
              />
              <RangeControl
                label="Espacamento entre blocos"
                value={settings.spacing}
                min={24}
                max={40}
                step={4}
                suffix="px"
                onChange={(value) => update("spacing", Number(value))}
              />
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-neutral-10">Modo de foco</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["calmo", "guiado", "contraste"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => update("focusMode", mode)}
                      className={cn(
                        "focus-ring rounded-2xl border px-3 py-2 text-sm font-semibold capitalize transition",
                        settings.focusMode === mode
                          ? "border-primary-60 bg-primary-60 text-white"
                          : "border-black/8 bg-neutral-95 text-neutral-10"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="button" onClick={save} disabled={mutation.isPending} className="rounded-2xl">
                {mutation.isPending ? "Salvando..." : "Salvar preferencias"}
              </Button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="focus-ring inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-60 text-white shadow-[0_20px_40px_rgba(83,114,210,0.35)] transition hover:bg-primary-50"
          aria-label="Abrir painel de acessibilidade"
        >
          {open ? <X className="h-5 w-5" /> : <Accessibility className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-neutral-10">{label}</label>
        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-95 px-2.5 py-1 text-xs font-bold text-neutral-30">
          <SlidersHorizontal className="h-3 w-3" />
          {value}
          {suffix}
        </span>
      </div>
      <input
        className="accent-[#5874D8]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
