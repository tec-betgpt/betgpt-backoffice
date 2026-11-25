import { describe, expect, it } from "vitest";
import {
  isProxiableRecordType,
  normalizeRecordName,
  RECORD_TYPES,
} from "@/lib/dnsRecord";

describe("normalizeRecordName", () => {
  it("usa o nome da zona quando o valor é @ ou vazio", () => {
    expect(normalizeRecordName("@", "cliente.com")).toBe("cliente.com");
    expect(normalizeRecordName("   ", "cliente.com")).toBe("cliente.com");
  });

  it("completa nomes relativos simples com a zona", () => {
    expect(normalizeRecordName("www", "cliente.com")).toBe("www.cliente.com");
    expect(normalizeRecordName("_dmarc", "cliente.com")).toBe(
      "_dmarc.cliente.com",
    );
  });

  it("aceita o nome completo quando pertence à zona", () => {
    expect(normalizeRecordName("www.cliente.com", "cliente.com")).toBe(
      "www.cliente.com",
    );
    expect(normalizeRecordName("CLIENTE.COM.", "cliente.com")).toBe(
      "cliente.com",
    );
  });

  it("rejeita nomes fora da zona", () => {
    expect(normalizeRecordName("outrodominio.com", "cliente.com")).toBeNull();
    expect(normalizeRecordName("naoccliente.com", "cliente.com")).toBeNull();
  });
});

describe("isProxiableRecordType", () => {
  it("permite proxy apenas em A, AAAA e CNAME", () => {
    expect(isProxiableRecordType("A")).toBe(true);
    expect(isProxiableRecordType("AAAA")).toBe(true);
    expect(isProxiableRecordType("CNAME")).toBe(true);
    expect(isProxiableRecordType("TXT")).toBe(false);
  });
});

describe("RECORD_TYPES", () => {
  it("expõe apenas tipos seguros para escrita", () => {
    expect(RECORD_TYPES.map((type) => type.value)).toEqual([
      "A",
      "AAAA",
      "CNAME",
      "TXT",
    ]);
  });
});
