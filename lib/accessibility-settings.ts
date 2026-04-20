import type { SettingsInput } from "@/lib/schemas";

export const defaultAccessibilitySettings: SettingsInput = {
  fontSize: 16,
  spacing: 24,
  focusMode: "calmo"
};

export function normalizeAccessibilitySettings(
  settings?:
    | {
        fontSize: number;
        spacing: number;
        focusMode: string;
      }
    | null
): SettingsInput {
  return {
    fontSize: settings?.fontSize ?? defaultAccessibilitySettings.fontSize,
    spacing: settings?.spacing ?? defaultAccessibilitySettings.spacing,
    focusMode: (settings?.focusMode as SettingsInput["focusMode"] | undefined) ?? defaultAccessibilitySettings.focusMode
  };
}
