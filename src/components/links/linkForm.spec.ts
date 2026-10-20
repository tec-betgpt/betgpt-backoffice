import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  addParam,
  buildUpdatePayload,
  createDefaultForm,
  fillFormFromLink,
  removeParam,
  sanitizePayload,
  validateForm,
} from "@/components/links/linkForm";
import type { LinkDetailsResponse } from "@/contracts/link";

beforeEach(() => {
  setActivePinia(createPinia());
  const workspaceStore = useWorkspaceStore();
  workspaceStore.activeGroupProject = {
    id: "1",
    project_id: "1",
    is_selected: true,
    label: "Projeto",
    logo: null,
    name: "Projeto",
    type: "project",
  };
});

describe("linkForm params", () => {
  it("createDefaultForm inicia com params vazio", () => {
    expect(createDefaultForm().params).toEqual([]);
  });

  it("addParam/removeParam gerenciam as linhas", () => {
    const form = createDefaultForm();
    addParam(form.params);
    addParam(form.params);
    expect(form.params).toEqual([
      { name: "", value: "" },
      { name: "", value: "" },
    ]);

    removeParam(form.params, 0);
    expect(form.params).toEqual([{ name: "", value: "" }]);
  });

  it("sanitizePayload envia params trimados e ignora linhas vazias", () => {
    const form = createDefaultForm();
    form.code = "promo-x1";
    form.destinations[0].url = "https://destino.example.com/landing";
    form.params = [
      { name: " ref ", value: " promo10 " },
      { name: "utm_device", value: "mobile" },
      { name: "  ", value: "  " },
    ];

    const payload = sanitizePayload(form) as Record<string, any>;

    expect(payload.params).toEqual([
      { name: "ref", value: "promo10" },
      { name: "utm_device", value: "mobile" },
    ]);
  });

  it("sanitizePayload envia params vazio quando não há linhas", () => {
    const form = createDefaultForm();
    form.code = "promo-x1";
    form.destinations[0].url = "https://destino.example.com/landing";

    expect((sanitizePayload(form) as Record<string, any>).params).toEqual([]);
  });

  it("buildUpdatePayload sempre inclui params (substituição): vazio limpa os existentes", () => {
    const form = createDefaultForm();
    form.code = "promo-x1";
    form.destinations[0].url = "https://destino.example.com/landing";
    form.params = [];

    const payload = buildUpdatePayload(form) as Record<string, any>;
    expect(payload).toHaveProperty("params");
    expect(payload.params).toEqual([]);
  });

  it("validateForm acusa nome duplicado no mesmo link", () => {
    const form = createDefaultForm();
    form.code = "promo-x1";
    form.destinations[0].url = "https://destino.example.com/landing";
    form.params = [
      { name: "ref", value: "a" },
      { name: "ref", value: "b" },
    ];

    expect(validateForm(form).params).toContain("ref");
  });

  it("validateForm exige nome e valor quando a linha está preenchida", () => {
    const form = createDefaultForm();
    form.code = "promo-x1";
    form.destinations[0].url = "https://destino.example.com/landing";
    form.params = [{ name: "", value: "apenas-valor" }];

    const errors = validateForm(form);
    expect(errors["params.0.name"]).toBeTruthy();
  });

  it("fillFormFromLink popula params a partir do link", () => {
    const form = createDefaultForm();
    const link = {
      id: 42,
      project_id: 1,
      code: "promo-x1",
      params: [
        { name: "ref", value: "promo10" },
        { name: "utm_device", value: "mobile" },
      ],
    } as unknown as LinkDetailsResponse;

    fillFormFromLink(form, link, "https://destino.example.com/landing");

    expect(form.params).toEqual([
      { name: "ref", value: "promo10" },
      { name: "utm_device", value: "mobile" },
    ]);
  });
});
