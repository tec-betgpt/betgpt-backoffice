import { describe, expect, it } from "vitest";
import { isApexDomain, normalizeHostname } from "@/lib/apexDomain";

describe("normalizeHostname", () => {
  it("remove protocolo, caminho, ponto final e caixa alta", () => {
    expect(normalizeHostname("  HTTPS://Meusite.com.br/path?x=1  ")).toBe(
      "meusite.com.br",
    );
    expect(normalizeHostname("links.meusite.com.br.")).toBe(
      "links.meusite.com.br",
    );
  });
});

describe("isApexDomain", () => {
  it("reconhece domínios raiz", () => {
    expect(isApexDomain("meusite.com")).toBe(true);
    expect(isApexDomain("meusite.com.br")).toBe(true);
    expect(isApexDomain("meusite.net.br")).toBe(true);
    expect(isApexDomain("meusite.co.uk")).toBe(true);
    expect(isApexDomain("https://meusite.com.br/")).toBe(true);
  });

  it("não considera subdomínios como raiz", () => {
    expect(isApexDomain("links.meusite.com.br")).toBe(false);
    expect(isApexDomain("go.meusite.com")).toBe(false);
    expect(isApexDomain("a.b.meusite.com.br")).toBe(false);
  });

  it("ignora valores inválidos, IPs e hosts sem ponto", () => {
    expect(isApexDomain("")).toBe(false);
    expect(isApexDomain("   ")).toBe(false);
    expect(isApexDomain("localhost")).toBe(false);
    expect(isApexDomain("192.168.0.1")).toBe(false);
    expect(isApexDomain("meusite..com")).toBe(false);
  });
});
