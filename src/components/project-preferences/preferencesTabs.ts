import type { LocationQueryValue } from "vue-router";

export const PREFERENCES_TABS = [
  "projeto",
  "google-analytics",
  "meta-ads",
] as const;

export type PreferencesTab = (typeof PREFERENCES_TABS)[number];

export const DEFAULT_PREFERENCES_TAB: PreferencesTab = "projeto";

type TabQueryValue = LocationQueryValue | LocationQueryValue[] | undefined | null;

/**
 * Resolve a aba ativa a partir do parâmetro `tab` da URL, ignorando valores
 * desconhecidos e caindo na aba de projeto.
 */
export function resolvePreferencesTab(value: TabQueryValue): PreferencesTab {
  const candidate = Array.isArray(value) ? value.find((item) => item != null) : value;

  return PREFERENCES_TABS.includes(candidate as PreferencesTab)
    ? (candidate as PreferencesTab)
    : DEFAULT_PREFERENCES_TAB;
}
