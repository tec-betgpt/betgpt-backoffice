export interface LinkApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface LinkDestination {
  id?: number;
  url: string;
  backup_url?: string | null;
  weight?: number | null;
  variant_key?: string | null;
  status?: "active" | "unhealthy" | "disabled" | string | null;
  is_healthy?: boolean | null;
}

export interface LinkUtmSnapshot {
  id?: number;
  link_version_id?: number;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  channel?: string | null;
  campaign_utm?: string | null;
  channel_utm?: string | null;
  workspace_utm?: string | null;
  system_fallback?: string | null;
  preserve_original?: boolean | null;
  context?: Record<string, unknown> | null;
  snapshot_at?: string | null;
  [key: string]: unknown;
}

export interface LinkVersion {
  id?: number;
  created_at?: string | null;
  destination?: LinkDestination | null;
  utmSnapshots?: LinkUtmSnapshot[];
  utm_snapshots?: LinkUtmSnapshot[];
  [key: string]: unknown;
}

export interface LinkListItem {
  id: number;
  project_id: number;
  code: string;
  slug?: string | null;
  status?: string | null;
  type?: string | null;
  archived_at?: string | null;
  fallback_url?: string | null;
  reason?: string | null;
  destination?: LinkDestination | null;
  versions?: LinkVersion[];
  utmSnapshots?: LinkUtmSnapshot[];
  utm_snapshots?: LinkUtmSnapshot[];
  project?: {
    id: number;
    name: string;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  preserve_original?: boolean | null;
  channel?: string | null;
  campaign_utm?: string | null;
  channel_utm?: string | null;
  workspace_utm?: string | null;
  system_fallback?: string | null;
  context?: string | null;
  snapshot_at?: string | null;
  [key: string]: unknown;
}

export interface LinkDetailsResponse extends LinkListItem {
  versions: LinkVersion[];
  utmSnapshots: LinkUtmSnapshot[];
  utm_snapshots?: LinkUtmSnapshot[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  [key: string]: unknown;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface LinkListResponse {
  data: LinkListItem[];
  links?: PaginationLink[];
  meta: PaginationMeta;
  [key: string]: unknown;
}

export interface LinkListParams {
  filter_id?: string | number;
  project_id?: string | number;
  status?: string;
  type?: string;
  search?: string;
  per_page?: string | number;
  page?: number;
}

export interface LinkFormPayloadBase {
  project_id?: number;
  code?: string;
  slug?: string | null;
  status?: string | null;
  type?: string | null;
  fallback_url?: string | null;
  reason?: string | null;
  destination?: LinkDestination;
  utm?: Record<string, string | null> | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  preserve_original?: boolean;
  channel?: string | null;
  campaign_utm?: string | null;
  channel_utm?: string | null;
  workspace_utm?: string | null;
  system_fallback?: string | null;
  context?: string | null;
  snapshot_at?: string | null;
  archived_at?: string | null;
}

export type LinkCreatePayload = Required<Pick<LinkFormPayloadBase, "project_id" | "code" | "destination">> & LinkFormPayloadBase;
export type LinkUpdatePayload = LinkFormPayloadBase;
export type LinkArchiveResponse = LinkDetailsResponse;

export const LINK_DESTINATION_STATUS_OPTIONS = [
  { label: "Ativo", value: "active" },
  { label: "Instável", value: "unhealthy" },
  { label: "Desativado", value: "disabled" },
];

export const LINK_CHANNEL_OPTIONS = [
  { label: "SMS", value: "sms" },
  { label: "E-mail", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Web Push", value: "webpush" },
  { label: "Inbox", value: "inbox" },
  { label: "On-site", value: "onsite" },
  { label: "Voice", value: "voice" },
];

export const LINK_STATUS_OPTIONS = [
  { label: "Rascunho", value: "draft" },
  { label: "Ativo", value: "active" },
  { label: "Pausado", value: "paused" },
  { label: "Arquivado", value: "archived" },
];

export const LINK_TYPE_OPTIONS = [
  { label: "Padrão", value: "tracked" },
  { label: "Campanha", value: "campaign" },
  { label: "Afiliado", value: "affiliate" },
  { label: "Indicação", value: "referral" },
  { label: "Experimento A/B", value: "ab_experiment" },
  { label: "Divisão ponderada", value: "split" },
];