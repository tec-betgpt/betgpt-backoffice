export const RECORD_TYPES = [
  { value: "A", label: "A" },
  { value: "AAAA", label: "AAAA" },
  { value: "CNAME", label: "CNAME" },
  { value: "TXT", label: "TXT" },
] as const;

export const PROXIABLE_RECORD_TYPES = ["A", "AAAA", "CNAME"];

export function isProxiableRecordType(type: string): boolean {
  return PROXIABLE_RECORD_TYPES.includes(type.toUpperCase());
}

/**
 * Converte o nome digitado pelo usuário em um nome absoluto dentro da zona.
 *
 * `@` e vazio viram o próprio domínio da zona; nomes relativos (`www`)
 * ganham o sufixo da zona; nomes absolutos só são aceitos quando pertencem
 * à zona. Retorna `null` quando o nome está fora da zona.
 */
export function normalizeRecordName(
  input: string | null | undefined,
  zoneName: string,
): string | null {
  const zone = zoneName.trim().toLowerCase().replace(/\.+$/, "");

  if (!zone) {
    return null;
  }

  const name = (input ?? "").trim().toLowerCase().replace(/\.+$/, "");

  if (name === "" || name === "@") {
    return zone;
  }

  if (name === zone || name.endsWith(`.${zone}`)) {
    return name;
  }

  // Sem ponto é um rótulo relativo (`www`, `_dmarc`); com ponto já é um
  // domínio absoluto e, se não pertencer à zona, é inválido.
  if (!name.includes(".")) {
    return `${name}.${zone}`;
  }

  return null;
}
