import { describe, expect, it } from "vitest";
import type { MarketingAsset } from "@/contracts/marketingAssets";
import {
  buildAssetPayload,
  createEmptyAssetForm,
  fillAssetForm,
  validateAssetForm,
} from "./marketingAssetForm";

describe("marketingAssetForm", () => {
  it("valida campos obrigatórios comuns e de e-mail", () => {
    const form = createEmptyAssetForm();
    expect(validateAssetForm(form, "email")).toBe("Informe o nome do template.");
    form.name = "Boas-vindas";
    expect(validateAssetForm(form, "email")).toBe("Monte o conteúdo do e-mail no editor.");
    form.body = "<html><head><style>p{color:red}</style></head><body><table><tr><td></td></tr></table></body></html>";
    expect(validateAssetForm(form, "email")).toBe("Monte o conteúdo do e-mail no editor.");
    form.body = "<p>Olá</p>";
    expect(validateAssetForm(form, "email")).toBe("Informe o assunto do e-mail.");
    form.subject = "Bem-vindo";
    expect(validateAssetForm(form, "email")).toBeNull();
  });

  it("monta payload de e-mail com remetente e JSON", () => {
    const form = {
      ...createEmptyAssetForm(),
      name: "E-mail",
      subject: "Assunto",
      body: "<p>Conteúdo</p>",
      fromAddress: "sender@example.test",
      fromName: "BetGPT",
      variables: '{"name":"Nome"}',
      metadata: '{"origin":"test"}',
    };
    expect(buildAssetPayload(form, "email", 12)).toMatchObject({
      project_id: 12,
      channel: "email",
      payload: { from_address: "sender@example.test", from_name: "BetGPT" },
      variables: { name: "Nome" },
      metadata: { origin: "test" },
    });
  });

  it("aplica limite de SMS", () => {
    const form = { ...createEmptyAssetForm(), name: "SMS", body: "a".repeat(1531) };
    expect(validateAssetForm(form, "sms")).toContain("1530");
  });

  it("exige título no Webpush e monta ação", () => {
    const form = { ...createEmptyAssetForm(), name: "Push", body: "Conteúdo" };
    expect(validateAssetForm(form, "webpush")).toBe("Informe o título do Webpush.");
    form.title = "Novidade";
    form.actionUrl = "https://example.test/promo";
    expect(buildAssetPayload(form, "webpush", 1).payload).toEqual({
      title: "Novidade",
      action_url: "https://example.test/promo",
    });
  });

  it("valida mídia completa para Whatsapp e RCS", () => {
    const form = { ...createEmptyAssetForm(), name: "WhatsApp", body: "Conteúdo", mediaType: "image", whatsappCategory: "utility" };
    expect(validateAssetForm(form, "whatsapp")).toContain("tipo e a URL");
    form.mediaUrl = "https://example.test/image.png";
    expect(validateAssetForm(form, "whatsapp")).toBeNull();
    expect(buildAssetPayload(form, "whatsapp", 1).payload).toEqual({
      category: "utility",
      media: { type: "image", url: "https://example.test/image.png" },
    });
  });

  it("rejeita JSON inválido", () => {
    const form = { ...createEmptyAssetForm(), name: "SMS", body: "Conteúdo", variables: "not-json" };
    expect(validateAssetForm(form, "sms")).toContain("JSON válido");
  });

  it("monta categoria e placeholders do WhatsApp", () => {
    const form = {
      ...createEmptyAssetForm(),
      name: "WhatsApp",
      body: "Olá, {{name}}",
      whatsappCategory: "utility",
      placeholders: "name, coupon",
    };
    expect(validateAssetForm(form, "whatsapp")).toBeNull();
    expect(buildAssetPayload(form, "whatsapp", 1).payload).toEqual({
      category: "utility",
      placeholders: ["name", "coupon"],
    });
  });

  it("valida e monta botões do PopUp", () => {
    const form = {
      ...createEmptyAssetForm(),
      name: "PopUp",
      body: "<p>Conteúdo</p>",
      popupButtons: [{ label: "Aproveitar", actionUrl: "https://example.test" }],
    };
    expect(validateAssetForm(form, "popup")).toBeNull();
    expect(buildAssetPayload(form, "popup", 1).payload).toEqual({
      buttons: [{ label: "Aproveitar", action_url: "https://example.test" }],
    });
    form.popupButtons[0].actionUrl = "";
    expect(validateAssetForm(form, "popup")).toContain("rótulo e a ação");
  });

  it("Callcenter exige áudio e não exige corpo", () => {
    const form = { ...createEmptyAssetForm(), name: "Callcenter" };
    expect(validateAssetForm(form, "callcenter")).toBe("Selecione um arquivo de áudio.");
    form.audioPreviewUrl = "blob:audio";
    expect(validateAssetForm(form, "callcenter")).toBeNull();
    expect(buildAssetPayload(form, "callcenter", 1).body).toBe("");
  });

  it("preenche o formulário de edição com o asset atual", () => {
    const asset = {
      id: 1,
      project_id: 1,
      channel: "email",
      name: "Template",
      subject: "Assunto",
      body: "Conteúdo",
      locale: "pt-BR",
      payload: { from_name: "BetGPT" },
      variables: { name: "Nome" },
      metadata: null,
      created_at: null,
      updated_at: null,
    } as MarketingAsset;
    expect(fillAssetForm(asset)).toMatchObject({
      name: "Template",
      subject: "Assunto",
      fromName: "BetGPT",
    });
  });

  it("guarda o design do editor de e-mail nos metadados sem expor no campo JSON", () => {
    const design = { body: { rows: [] }, schemaVersion: 16 };
    const form = {
      ...createEmptyAssetForm(),
      name: "E-mail",
      subject: "Assunto",
      body: "<p>Conteúdo</p>",
      metadata: '{"origin":"test"}',
      emailDesign: design,
    };
    const payload = buildAssetPayload(form, "email", 3);
    expect(payload.metadata).toEqual({ origin: "test", email_design: design });

    const filled = fillAssetForm({
      id: 1,
      project_id: 3,
      channel: "email",
      name: "E-mail",
      subject: "Assunto",
      body: "<p>Conteúdo</p>",
      locale: null,
      payload: null,
      variables: null,
      metadata: payload.metadata,
      created_at: null,
      updated_at: null,
    } as MarketingAsset);
    expect(filled.emailDesign).toEqual(design);
    expect(JSON.parse(filled.metadata)).toEqual({ origin: "test" });
  });
});
