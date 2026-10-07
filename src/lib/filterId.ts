export type WorkspaceFilterType = "project" | "group" | "all" | "unknown";

export interface ParsedFilterId {
  type: WorkspaceFilterType;
  numericId: number | null;
}

export function parseFilterId(filterId: string | null | undefined): ParsedFilterId {
  if (!filterId) {
    return { type: "unknown", numericId: null };
  }

  if (filterId === "all") {
    return { type: "all", numericId: null };
  }

  if (/^\d+$/.test(filterId)) {
    return { type: "project", numericId: Number(filterId) };
  }

  const separatorIndex = filterId.indexOf("_");
  if (separatorIndex <= 0) {
    return { type: "unknown", numericId: null };
  }

  const prefix = filterId.slice(0, separatorIndex);
  const rawId = filterId.slice(separatorIndex + 1);
  const numericId = Number(rawId);
  const validId = /^\d+$/.test(rawId) && numericId > 0 ? numericId : null;

  if (prefix === "project" || prefix === "group") {
    return { type: prefix, numericId: validId };
  }

  return { type: "unknown", numericId: null };
}

export function filterIdToProjectId(filterId: string | null | undefined): number | null {
  const parsed = parseFilterId(filterId);
  return parsed.type === "project" ? parsed.numericId : null;
}

export function filterIdToGroupId(filterId: string | null | undefined): number | null {
  const parsed = parseFilterId(filterId);
  return parsed.type === "group" ? parsed.numericId : null;
}
