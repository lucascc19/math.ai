"use client";

import { create } from "zustand";
import type { SettingsInput } from "@/lib/schemas";
import type { DashboardResponse } from "@/lib/api";
import { defaultAccessibilitySettings } from "@/lib/accessibility-settings";

type AppState = {
  activeSkillId: string | null;
  settings: SettingsInput;
  dashboard: DashboardResponse | null;
  setActiveSkillId: (value: string) => void;
  setSettings: (value: SettingsInput) => void;
  setDashboard: (value: DashboardResponse) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeSkillId: null,
  settings: defaultAccessibilitySettings,
  dashboard: null,
  setActiveSkillId: (value) => set({ activeSkillId: value }),
  setSettings: (value) => set({ settings: value }),
  setDashboard: (value) =>
    set((state) => ({
      dashboard: value,
      activeSkillId: state.activeSkillId ?? value.skills[0]?.id ?? null,
      settings: value.settings
    }))
}));
