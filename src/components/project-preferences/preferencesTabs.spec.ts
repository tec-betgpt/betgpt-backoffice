import { describe, expect, it } from "vitest";
import { resolvePreferencesTab } from "./preferencesTabs";

describe("resolvePreferencesTab", () => {
  it("abre a aba de projeto quando nenhuma aba é informada", () => {
    expect(resolvePreferencesTab(undefined)).toBe("projeto");
  });

  it("aceita uma aba válida", () => {
    expect(resolvePreferencesTab("google-analytics")).toBe("google-analytics");
    expect(resolvePreferencesTab("meta-ads")).toBe("meta-ads");
  });

  it("cai na aba de projeto quando a aba é desconhecida", () => {
    expect(resolvePreferencesTab("nao-existe")).toBe("projeto");
  });

  it("aceita o valor de query em formato de lista", () => {
    expect(resolvePreferencesTab(["meta-ads"])).toBe("meta-ads");
    expect(resolvePreferencesTab(["desconhecida", "projeto"])).toBe("projeto");
  });
});
