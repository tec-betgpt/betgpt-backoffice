import { describe, expect, it } from "vitest";
import {
  formatClickCount,
  getLinkClickMetrics,
} from "@/components/links/linkClicks";
import type { LinkListItem } from "@/contracts/link";

function link(overrides: Partial<LinkListItem> = {}): LinkListItem {
  return {
    id: 1,
    project_id: 1,
    code: "promo-x",
    short_url: "https://le.example.com/promo-x",
    ...overrides,
  };
}

describe("getLinkClickMetrics", () => {
  it("lê o bloco clicks quando o backend envia o contrato novo", () => {
    expect(
      getLinkClickMetrics(link({ clicks: { total: 120, last_24h: 8 } })),
    ).toEqual({ total: 120, last24h: 8 });
  });

  it("aceita os campos achatados como fallback", () => {
    expect(
      getLinkClickMetrics(link({ total_clicks: 120, clicks_24h: 8 })),
    ).toEqual({ total: 120, last24h: 8 });
  });

  it("retorna nulo quando o backend ainda não expõe cliques", () => {
    expect(getLinkClickMetrics(link())).toEqual({ total: null, last24h: null });
  });
});

describe("formatClickCount", () => {
  it("formata números em pt-BR", () => {
    expect(formatClickCount(1234)).toBe("1.234");
  });

  it("usa travessão quando não há dado", () => {
    expect(formatClickCount(null)).toBe("—");
  });
});
