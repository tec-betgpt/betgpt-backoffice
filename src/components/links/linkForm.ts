import type {
  LinkCreatePayload,
  LinkDetailsResponse,
  LinkListItem,
  LinkUtmSnapshot,
  LinkUpdatePayload,
} from "@/contracts/link";
import { useWorkspaceStore } from "@/stores/workspace";

export const SELECT_ALL_VALUE = "__all__";
export const SELECT_NONE_VALUE = "__none__";

export interface LinkFormState {
  project_id: string | number;
  code: string;
  slug: string;
  status: string;
  type: string;
  fallback_url: string;
  reason: string;
  destination: {
    url: string;
    backup_url: string;
    weight: string;
    variant_key: string;
    status: string;
    is_healthy: boolean;
  };
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  preserve_original: boolean;
  channel: string;
  campaign_utm: string;
  channel_utm: string;
  workspace_utm: string;
  system_fallback: string;
  context: string;
  snapshot_at: string;
}

export function getActiveProjectId() {
  const workspaceStore = useWorkspaceStore();
  return workspaceStore.activeGroupProject?.project_id || workspaceStore.activeGroupProject?.id || "";
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
    destination: {
      url: "",
      backup_url: "",
      weight: "",
      variant_key: "",
      status: SELECT_NONE_VALUE,
      is_healthy: true,
    },
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    preserve_original: false,
    channel: SELECT_NONE_VALUE,
    campaign_utm: "",
    channel_utm: "",
    workspace_utm: "",
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

  if (!form.destination.url.trim()) {
    errors["destination.url"] = "Informe a URL de destino.";
  }

  return errors;
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
    campaign_utm: form.campaign_utm || null,
    channel_utm: form.channel_utm || null,
    workspace_utm: form.workspace_utm || null,
    system_fallback: form.system_fallback || null,
    context: form.context || null,
    snapshot_at: form.snapshot_at || null,
    utm_source: form.utm_source || null,
    utm_medium: form.utm_medium || null,
    utm_campaign: form.utm_campaign || null,
    utm_term: form.utm_term || null,
    utm_content: form.utm_content || null,
    destination: {
      url: form.destination.url.trim(),
      backup_url: form.destination.backup_url || null,
      weight: form.destination.weight === "" ? null : Number(form.destination.weight),
      variant_key: form.destination.variant_key || null,
      status: denormalizeSelectValue(form.destination.status),
      is_healthy: form.destination.is_healthy,
    },
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined),
  );
}

export function buildUpdatePayload(form: LinkFormState): LinkUpdatePayload {
  const payload = sanitizePayload(form) as LinkCreatePayload;

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null),
  ) as LinkUpdatePayload;
}

export function mapApiErrors(error: any) {
  const responseErrors = error?.response?.data?.errors || error?.response?.data?.data || {};
  const mappedErrors: Record<string, string> = {};

  Object.entries(responseErrors).forEach(([key, value]) => {
    mappedErrors[key] = Array.isArray(value) ? value.join(", ") : String(value);
  });

  return mappedErrors;
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
  form.destination.url = destinationUrl === "—" ? "" : destinationUrl;
  form.destination.backup_url = link.destination?.backup_url || "";
  form.destination.weight = link.destination?.weight !== null && link.destination?.weight !== undefined
    ? String(link.destination.weight)
    : "";
  form.destination.variant_key = link.destination?.variant_key || "";
  form.destination.status = normalizeSelectValue(link.destination?.status || null);
  form.destination.is_healthy = Boolean(link.destination?.is_healthy ?? true);
  form.utm_source = String(snapshot?.utm_source ?? link.utm_source ?? "");
  form.utm_medium = String(snapshot?.utm_medium ?? link.utm_medium ?? "");
  form.utm_campaign = String(snapshot?.utm_campaign ?? link.utm_campaign ?? "");
  form.utm_term = String(snapshot?.utm_term ?? link.utm_term ?? "");
  form.utm_content = String(snapshot?.utm_content ?? link.utm_content ?? "");
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
  form.campaign_utm = String(snapshot?.campaign_utm ?? link.campaign_utm ?? "");
  form.channel_utm = String(snapshot?.channel_utm ?? link.channel_utm ?? "");
  form.workspace_utm = String(snapshot?.workspace_utm ?? link.workspace_utm ?? "");
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
  return link.destination?.url || link.versions?.[0]?.destination?.url || "—";
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