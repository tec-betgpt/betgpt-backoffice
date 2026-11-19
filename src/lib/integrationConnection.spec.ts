import { describe, expect, it } from "vitest";
import { isOAuthConnected } from "./integrationConnection";

describe("isOAuthConnected", () => {
  it("retorna false quando a integração não existe", () => {
    expect(isOAuthConnected(null)).toBe(false);
    expect(isOAuthConnected(undefined)).toBe(false);
  });

  it("retorna false quando o config não é um objeto", () => {
    expect(isOAuthConnected({ config: null })).toBe(false);
    expect(isOAuthConnected({ config: [] })).toBe(false);
    expect(isOAuthConnected({ config: "conectado" })).toBe(false);
  });

  it("reconhece as flags de conexão", () => {
    expect(isOAuthConnected({ config: { connected: true } })).toBe(true);
    expect(isOAuthConnected({ config: { authorized: true } })).toBe(true);
  });

  it("reconhece os metadados de OAuth gravados no config", () => {
    expect(isOAuthConnected({ config: { access_token: "token" } })).toBe(true);
    expect(isOAuthConnected({ config: { refresh_token: "token" } })).toBe(true);
    expect(isOAuthConnected({ config: { connected_at: "2026-11-19T10:00:00Z" } })).toBe(true);
    expect(isOAuthConnected({ config: { email: "conta@exemplo.com" } })).toBe(true);
  });

  it("ignora valores vazios ou que não são texto", () => {
    expect(isOAuthConnected({ config: { access_token: "" } })).toBe(false);
    expect(isOAuthConnected({ config: { access_token: "   " } })).toBe(false);
    expect(isOAuthConnected({ config: { access_token: 123 } })).toBe(false);
    expect(isOAuthConnected({ config: { connected: false } })).toBe(false);
  });
});
