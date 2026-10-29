import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  addParam,
  buildUpdatePayload,
  createDefaultForm,
  fillFormFromLink,
  getActiveVersion,
  getDestinationUrl,
  getVersionNumber,
  removeParam,
  sanitizePayload,
  validateForm,
} from "@/components/links/linkForm";
import type { LinkDetailsResponse, LinkListItem } from "@/contracts/link";

function buildLink(overrides: Partial<LinkListItem> = {}): LinkListItem {
  return {
    id: 1,
    project_id: 84,
    code: "telegram-roleta",
    short_url: "https://click.example.com/telegram-roleta",
    ...overrides,
  } as LinkListItem;
}

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

  it("getActiveVersion prioriza a versão ativa da listagem", () => {
    const link = buildLink({
      versions: [
        { id: 52, version: 1, is_active: false, destinations: [{ url: "https://antigo.example.com" }] },
        { id: 53, version: 2, is_active: true, destinations: [{ url: "https://atual.example.com" }] },
      ],
    });

    expect(getActiveVersion(link)?.id).toBe(53);
  });

  it("getActiveVersion usa a última versão quando nenhuma está ativa", () => {
    const link = buildLink({
      versions: [
        { id: 17, version: 1, is_active: false, destinations: [{ url: "https://v1.example.com" }] },
        { id: 49, version: 11, is_active: false, destinations: [{ url: "https://v11.example.com" }] },
      ],
    });

    expect(getActiveVersion(link)?.id).toBe(49);
  });

  it("getDestinationUrl lê destinations da versão ativa da listagem", () => {
    const link = buildLink({
      versions: [
        { id: 52, version: 1, is_active: false, destinations: [{ id: 52, url: "https://antigo.example.com" }] },
        { id: 53, version: 2, is_active: true, destinations: [{ id: 53, url: "https://atual.example.com" }] },
      ],
    });

    expect(getDestinationUrl(link)).toBe("https://atual.example.com");
  });

  it("getActiveVersion prioriza last_version no detalhe mesmo com versions presentes", () => {
    const link = {
      ...buildLink({
        versions: [
          { id: 52, version: 1, is_active: true, destinations: [{ url: "https://antigo.example.com" }] },
        ],
      }),
      last_version: {
        id: 63,
        version: 4,
        destinations: [{ url: "https://ultima.example.com" }],
      },
    } as LinkDetailsResponse;

    expect(getActiveVersion(link)?.id).toBe(63);
  });

  it("getDestinationUrl lê destinations do last_version no detalhe", () => {
    const link = {
      ...buildLink(),
      last_version: {
        id: 63,
        version: 4,
        destinations: [{ id: 63, url: "https://destino.example.com/landing" }],
      },
    } as LinkDetailsResponse;

    expect(getDestinationUrl(link)).toBe("https://destino.example.com/landing");
  });

  it("getDestinationUrl retorna travessão quando não há destino", () => {
    expect(getDestinationUrl(buildLink())).toBe("—");
  });

  it("getVersionNumber usa o número da versão e não o id", () => {
    expect(getVersionNumber({ id: 63, version: 4 })).toBe(4);
    expect(getVersionNumber({ id: 63 })).toBe(63);
    expect(getVersionNumber(null)).toBeNull();
  });

  it("fillFormFromLink popula destinations a partir da versão ativa", () => {
    const form = createDefaultForm();
    const link = buildLink({
      versions: [
        { id: 52, version: 1, is_active: false, destinations: [{ id: 52, url: "https://antigo.example.com", weight: 100 }] },
        { id: 53, version: 2, is_active: true, destinations: [{ id: 53, url: "https://atual.example.com", weight: 100 }] },
      ],
    });

    fillFormFromLink(form, link, getDestinationUrl(link));

    expect(form.destinations).toEqual([
      { url: "https://atual.example.com", weight: "100", variant_key: "" },
    ]);
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
