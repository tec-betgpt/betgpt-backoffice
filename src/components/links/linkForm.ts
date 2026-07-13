import type {
  LinkCreatePayload,
  LinkDestination,
  LinkDetailsResponse,
  LinkListItem,
  LinkUtmObject,
  LinkUtmSnapshot,
  LinkUpdatePayload,
} from "@/contracts/link";
import { useWorkspaceStore } from "@/stores/workspace";

export const SELECT_ALL_VALUE = "__all__";
export const SELECT_NONE_VALUE = "__none__";
export const MAX_DESTINATIONS = 3;

export interface UtmGroup {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
}

export interface DestinationState {
  url: string;
  weight: string;
  variant_key: string;
}

export interface LinkFormState {
  project_id: string | number;
  code: string;
  slug: string;
  status: string;
  type: string;
  fallback_url: string;
  reason: string;
  destinations: DestinationState[];
  utm: UtmGroup;
  preserve_original: boolean;
  channel: string;
  system_fallback: string;
  context: string;
  snapshot_at: string;
}

export function getActiveProjectId() {
  const workspaceStore = useWorkspaceStore();
  return workspaceStore.activeGroupProject?.project_id || workspaceStore.activeGroupProject?.id || "";
}

function defaultUtmGroup(): UtmGroup {
  return { utm_source: "", utm_medium: "", utm_campaign: "", utm_content: "", utm_term: "" };
}

function defaultDestination(): DestinationState {
  return { url: "", weight: "100", variant_key: "" };
}

export function createDefaultForm(): LinkFormState {
  return {
    project_id: getActiveProjectId(),
    code: "",
    slug: "",
    status: SELECT_NONE_VALUE,
    type: SELECT_NONE_VALUE,
    fallback_url: "",
    reason: "",
    destinations: [defaultDestination()],
    utm: defaultUtmGroup(),
    preserve_original: false,
    channel: SELECT_NONE_VALUE,
    system_fallback: "",
    context: "",
    snapshot_at: "",
  };
}

export function normalizeSelectValue(value?: string | null) {
  return value || SELECT_NONE_VALUE;
}

export function denormalizeSelectValue(value?: string | null) {
  return !value || value === SELECT_NONE_VALUE ? null : value;
}

export function validateForm(form: LinkFormState) {
  const errors: Record<string, string> = {};

  if (!String(form.project_id || "").trim()) {
    errors.project_id = "Projeto não identificado.";
  }

  if (!form.code.trim()) {
    errors.code = "Informe o código do link.";
  }

  const filledDestinations = form.destinations.filter((d) => d.url.trim());
  if (filledDestinations.length === 0) {
    errors["destinations.0.url"] = "Informe ao menos uma URL de destino.";
  }

  const totalWeight = form.destinations.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
  if (totalWeight !== 100) {
    errors["destinations.weight"] = `A soma dos pesos deve ser 100 (atual: ${totalWeight}).`;
  }

  return errors;
}

function buildUtmPayload(group: UtmGroup): LinkUtmObject | null {
  const obj: LinkUtmObject = {};
  if (group.utm_source) obj.utm_source = group.utm_source;
  if (group.utm_medium) obj.utm_medium = group.utm_medium;
  if (group.utm_campaign) obj.utm_campaign = group.utm_campaign;
  if (group.utm_content) obj.utm_content = group.utm_content;
  if (group.utm_term) obj.utm_term = group.utm_term;
  return Object.keys(obj).length ? obj : null;
}

export function sanitizePayload(form: LinkFormState) {
  const payload: Record<string, unknown> = {
    project_id: Number(form.project_id),
    code: form.code.trim(),
    slug: form.slug || null,
    status: denormalizeSelectValue(form.status),
    type: denormalizeSelectValue(form.type),
    fallback_url: form.fallback_url || null,
    reason: form.reason || null,
    preserve_original: form.preserve_original,
    channel: denormalizeSelectValue(form.channel),
    utm: buildUtmPayload(form.utm),
    system_fallback: form.system_fallback || null,
    snapshot_at: form.snapshot_at || null,
    destinations: form.destinations
      .filter((d) => d.url.trim())
      .map((d) => ({
        url: d.url.trim(),
        weight: d.weight === "" ? null : Number(d.weight),
        variant_key: d.variant_key || null,
      })),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined),
  );
}

export function buildUpdatePayload(form: LinkFormState): LinkUpdatePayload {
  const payload = sanitizePayload(form);

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null),
  ) as unknown as LinkUpdatePayload;
}

export function mapApiErrors(error: any) {
  const responseErrors = error?.response?.data?.errors || error?.response?.data?.data || {};
  const mappedErrors: Record<string, string> = {};

  Object.entries(responseErrors).forEach(([key, value]) => {
    mappedErrors[key] = Array.isArray(value) ? value.join(", ") : String(value);
  });

  return mappedErrors;
}

function parseUtmObject(value: unknown): UtmGroup {
  const empty = defaultUtmGroup();
  if (!value) return empty;
  let obj: Record<string, unknown> = {};
  if (typeof value === "string") {
    try { obj = JSON.parse(value); } catch { obj = {}; }
  } else if (typeof value === "object") {
    obj = value as Record<string, unknown>;
  }
  return {
    utm_source: String(obj.utm_source ?? ""),
    utm_medium: String(obj.utm_medium ?? ""),
    utm_campaign: String(obj.utm_campaign ?? ""),
    utm_content: String(obj.utm_content ?? ""),
    utm_term: String(obj.utm_term ?? ""),
  };
}

export function fillFormFromLink(form: LinkFormState, link: LinkListItem | LinkDetailsResponse, destinationUrl: string) {
  const snapshot = getLatestUtmSnapshot(link);
  const snapshotContext = snapshot?.context && typeof snapshot.context === "object"
    ? snapshot.context as Record<string, unknown>
    : null;

  form.project_id = String(link.project_id || getActiveProjectId());
  form.code = link.code || "";
  form.slug = link.slug || "";
  form.status = normalizeSelectValue(link.status);
  form.type = normalizeSelectValue(link.type);
  form.fallback_url = link.fallback_url || "";
  form.reason = String(link.reason || "");

  const linkDests = (link as LinkDetailsResponse).destinations as LinkDestination[] | undefined
    || (link as LinkDetailsResponse).last_version?.destinations;
  if (linkDests && linkDests.length > 0) {
    form.destinations = linkDests.map((d) => ({
      url: d.url || "",
      weight: d.weight !== null && d.weight !== undefined ? String(d.weight) : "",
      variant_key: d.variant_key || "",
    }));
    if (form.destinations.length === 0) form.destinations.push(defaultDestination());
  } else {
    form.destinations = [{
      url: destinationUrl === "—" ? "" : destinationUrl,
      weight: link.destination?.weight !== null && link.destination?.weight !== undefined
        ? String(link.destination.weight)
        : "",
      variant_key: link.destination?.variant_key || "",
    }];
  }
  Object.assign(form.utm, parseUtmObject(snapshot?.utm ?? link.utm ?? null));
  if (!form.utm.utm_source) form.utm.utm_source = String(snapshot?.utm_source ?? link.utm_source ?? "");
  if (!form.utm.utm_medium) form.utm.utm_medium = String(snapshot?.utm_medium ?? link.utm_medium ?? "");
  if (!form.utm.utm_campaign) form.utm.utm_campaign = String(snapshot?.utm_campaign ?? link.utm_campaign ?? "");
  if (!form.utm.utm_term) form.utm.utm_term = String(snapshot?.utm_term ?? link.utm_term ?? "");
  if (!form.utm.utm_content) form.utm.utm_content = String(snapshot?.utm_content ?? link.utm_content ?? "");
  form.preserve_original = Boolean(
    snapshot?.preserve_original
    ?? snapshotContext?.preserve_original
    ?? link.preserve_original,
  );
  form.channel = normalizeSelectValue(
    (typeof snapshot?.channel === "string" && snapshot.channel)
    || (typeof snapshotContext?.channel === "string" ? snapshotContext.channel : null)
    || link.channel
    || null,
  );

  form.system_fallback = String(snapshot?.system_fallback ?? link.system_fallback ?? "");
  form.context = snapshotContext ? JSON.stringify(snapshotContext, null, 2) : String(link.context || "");
  form.snapshot_at = String(
    snapshot?.snapshot_at
    ?? (typeof snapshotContext?.snapshot_at === "string" ? snapshotContext.snapshot_at : null)
    ?? link.snapshot_at
    ?? "",
  );
}

export function getDestinationUrl(link: LinkListItem | LinkDetailsResponse) {
  return link.destination?.url
    || link.versions?.[0]?.destination?.url
    || (link as LinkDetailsResponse).last_version?.destinations?.[0]?.url
    || "—";
}

export function addDestination(destinations: DestinationState[]) {
  if (destinations.length >= MAX_DESTINATIONS) return;
  destinations.push(defaultDestination());
}

export function removeDestination(destinations: DestinationState[], index: number) {
  if (destinations.length <= 1) return;
  destinations.splice(index, 1);
  const totalWeight = destinations.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);
  if (totalWeight === 0) {
    const even = Math.floor(100 / destinations.length);
    destinations.forEach((d, i) => {
      d.weight = String(i < destinations.length - 1 ? even : 100 - even * (destinations.length - 1));
    });
  }
}

export function getLatestUtmSnapshot(link: LinkListItem | LinkDetailsResponse): LinkUtmSnapshot | null {
  const snapshots = [
    ...(Array.isArray(link.utmSnapshots) ? link.utmSnapshots : []),
    ...(Array.isArray(link.utm_snapshots) ? link.utm_snapshots : []),
  ];

  if (!snapshots.length) {
    return null;
  }

  return [...snapshots].sort((left, right) => {
    const leftTime = Date.parse(left.snapshot_at || "") || Date.parse(String(left.created_at || "")) || 0;
    const rightTime = Date.parse(right.snapshot_at || "") || Date.parse(String(right.created_at || "")) || 0;
    return rightTime - leftTime;
  })[0];
}