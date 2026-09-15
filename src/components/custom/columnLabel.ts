export function normalizeColumnLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function columnMatchesSearch(label: string, search: string): boolean {
  const query = normalizeColumnLabel(search);
  if (!query) return true;
  return normalizeColumnLabel(label).includes(query);
}

export function isActionsColumn(column: {
  id?: string;
  accessorKey?: string;
  label?: string;
  header?: unknown;
  meta?: { label?: string };
}): boolean {
  const id = String(column.id ?? column.accessorKey ?? "").toLowerCase();
  if (id === "actions" || id === "acoes") return true;

  const label = column.label ?? resolveColumnLabel(column);
  return normalizeColumnLabel(String(label)) === "acoes";
}

function decodeJsString(value: string): string {
  return value
    .replace(/\\u\{([0-9A-Fa-f]+)\}/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
}

function quotedStrings(source: string): string[] {
  return [...source.matchAll(/["'`]([^"'`]+)["'`]/g)].map((match) => decodeJsString(match[1]));
}

function isNoiseString(value: string): boolean {
  return (
    value.length <= 1 ||
    /^(div|span|button|header|column)$/i.test(value) ||
    /^(text-|bg-|h-|w-|p-|m-|gap-|flex|capitalize|font-|sr-only|text-right|text-left|text-center)/.test(value)
  );
}

function looksLikeLabel(value: string): boolean {
  return /[A-ZÁÉÍÓÚÂÊÔÃÕÇÀ ]/.test(value) || /\s/.test(value);
}

function labelFromFunctionSource(fn: (...args: never[]) => unknown): string {
  try {
    const src = Function.prototype.toString.call(fn).replace(/\s+/g, " ");

    const buttonLabel = src.match(/createHeaderButton\(\s*["'`]([^"'`]+)["'`]/);
    if (buttonLabel?.[1]) return decodeJsString(buttonLabel[1]);

    const returned = src.match(/return\s+["'`]([^"'`]+)["'`]/);
    if (returned?.[1]) return decodeJsString(returned[1]);

    const arrow = src.match(/=>\s*["'`]([^"'`]+)["'`]/);
    if (arrow?.[1]) return decodeJsString(arrow[1]);

    const candidates = quotedStrings(src).filter((value) => !isNoiseString(value));
    return candidates.find(looksLikeLabel) ?? candidates[0] ?? "";
  } catch {
    return "";
  }
}

export function resolveColumnLabel(col: {
  id?: string;
  accessorKey?: string;
  header?: unknown;
  meta?: { label?: string };
}): string {
  const id = String(col.accessorKey ?? col.id ?? "");

  const metaLabel = col.meta?.label;
  if (typeof metaLabel === "string" && metaLabel.trim()) {
    return metaLabel.trim();
  }

  const header = col.header;
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }

  if (typeof header === "function") {
    const fromSource = labelFromFunctionSource(header);
    if (fromSource) return fromSource;
  }

  return id;
}
