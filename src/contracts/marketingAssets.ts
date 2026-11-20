export type MarketingChannel =
  | "sms"
  | "email"
  | "inbox"
  | "webpush"
  | "popup"
  | "callcenter"
  | "whatsapp"
  | "rcs";

export interface EmailAssetPayload {
  from_address?: string | null;
  from_name?: string | null;
  reply_to?: string | null;
}

export interface SmsAssetPayload {
  sender?: string | null;
}

export interface WebpushAssetPayload {
  title: string;
  icon?: string | null;
  action_url?: string | null;
}

export interface InboxAssetPayload {
  title?: string | null;
  action_url?: string | null;
}

export interface CallcenterAssetPayload {
  caller_id?: string | null;
  voice?: string | null;
}

export interface MediaAssetPayload {
  media?: {
    type: "image" | "video" | "document" | "audio";
    url: string;
  } | null;
}

export interface ChannelPayloadMap {
  email: EmailAssetPayload;
  sms: SmsAssetPayload;
  inbox: InboxAssetPayload;
  webpush: WebpushAssetPayload;
  popup: InboxAssetPayload;
  callcenter: CallcenterAssetPayload;
  whatsapp: MediaAssetPayload;
  rcs: MediaAssetPayload;
}

export interface MarketingAsset<C extends MarketingChannel = MarketingChannel> {
  id: number;
  project_id: number;
  channel: C;
  name: string;
  subject: string | null;
  body: string;
  locale: string | null;
  payload: (ChannelPayloadMap[C] & Record<string, unknown>) | null;
  variables: Record<string, unknown> | unknown[] | null;
  metadata: Record<string, unknown> | unknown[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MarketingAssetInput<C extends MarketingChannel = MarketingChannel> {
  project_id: number;
  channel: C;
  name: string;
  subject?: string | null;
  body: string;
  locale?: string | null;
  payload?: Record<string, unknown> | ChannelPayloadMap[C] | null;
  variables?: Record<string, unknown> | unknown[] | null;
  metadata?: Record<string, unknown> | unknown[] | null;
}

export type MarketingAssetUpdateInput = Partial<Omit<MarketingAssetInput, "project_id" | "channel">>;

export interface MarketingAssetListParams {
  project_id: number;
  channel?: MarketingChannel;
  search?: string | null;
  sorting?: string | null;
  sort_by?: "name" | "channel" | "created_at" | "updated_at";
  sort_order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface MarketingAssetListResponse {
  items: MarketingAsset[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MarketingAssetSummaryItem {
  id: number;
  name: string;
  channel: MarketingChannel;
  createdAt: string | null;
}

export type MarketingAssetSummary = Record<MarketingChannel, MarketingAssetSummaryItem[]>;

export interface MarketingAssetTestPayload {
  recipient_email?: string;
  recipient_phone?: string;
}

export interface MarketingAssetTestResult {
  asset_id: number;
  channel: "email" | "sms";
  provider?: string;
  message_id: string;
  status?: string;
  supplier_message_id?: string | null;
  supplier_dispatch_id?: string | null;
}

export const MARKETING_CHANNEL_LABELS: Record<MarketingChannel, string> = {
  email: "E-mail",
  inbox: "Inbox",
  webpush: "Webpush",
  sms: "SMS",
  popup: "PopUps",
  callcenter: "Callcenter",
  whatsapp: "Whatsapp",
  rcs: "RCS",
};

export const MARKETING_CHANNEL_OPTIONS = Object.entries(MARKETING_CHANNEL_LABELS).map(
  ([value, label]) => ({ value: value as MarketingChannel, label }),
);
