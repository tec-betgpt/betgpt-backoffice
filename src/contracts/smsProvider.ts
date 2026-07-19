// Contratos da API de Parceiros do SMS Funnel (proxy /v1/sms-provider).

export type SmsProviderApiResponse<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
  error?: {
    code?: string | null;
    message?: string;
    details?: Record<string, string[]> | null;
  };
};

export type SmsProviderPagination<T> = {
  current_page: number;
  data: T[];
  per_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  from?: number | null;
  to?: number | null;
};

// ----------------------------------------------------------------------
// Mensagem de teste / broadcasts
// ----------------------------------------------------------------------

export type SmsMessageStatus = "queued" | "sent" | "delivered" | "failed" | "undelivered";

export type SmsBroadcastStatus =
  | "pending"
  | "scheduled"
  | "sending"
  | "sent"
  | "sent_with_errors"
  | "cancelled"
  | "sanitizing"
  | "importing";

export type SmsSendMessageResult = {
  id: string;
  reference: string;
  phone: string;
  status: SmsMessageStatus;
  bill_factor: number;
};

export type SmsSendResponse = {
  broadcast_id: string;
  messages: SmsSendMessageResult[];
  unsupported_features: string[];
};

export type SmsMessageDetail = {
  id: string;
  reference: string | null;
  phone: string;
  status: SmsMessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
};

export type SmsBroadcast = {
  id: string;
  name: string;
  message: string;
  status: SmsBroadcastStatus;
  scheduled_date: string | null;
  leads_count: number;
  partner_reference: string | null;
  flash_sms: boolean;
  concat: boolean;
  from: string | null;
  idempotency_key: string | null;
  created_at: string;
  metrics?: { sent: number; failed: number; total: number };
  cancellation?: "complete" | "partial";
};

export type SmsBroadcastContact = {
  id: string;
  reference: string | null;
  phone: string;
  message: string;
  status: SmsMessageStatus;
  cancelled: boolean;
  created_at: string;
};

export type SmsTestMessagePayload = {
  phones: string[];
  message: string;
  url?: string | null;
  from?: string | null;
  flash_sms?: boolean;
};

// ----------------------------------------------------------------------
// Listas / leads
// ----------------------------------------------------------------------

export type SmsList = {
  id: string;
  name: string;
  leads_count: number;
  campaigns_count: number;
  created_at: string;
  updated_at: string;
};

export type SmsLead = {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  custom_fields: string[];
  blacklisted: boolean;
  created_at: string;
};

export type SmsLeadPayload = {
  phone: string;
  name: string;
  email?: string | null;
  custom_fields?: string[];
};

export type SmsAddLeadsResponse = {
  accepted_count: number;
  blacklisted_count: number;
  leads: { lead_id: string; status: string; blacklisted: boolean }[];
};

// ----------------------------------------------------------------------
// Campanhas do provedor (automações) / sequências
// ----------------------------------------------------------------------

export type SmsProviderCampaign = {
  id: string;
  name: string;
  active: boolean;
  lead_list_id: string | null;
  created_at: string;
  updated_at: string;
  sequences?: SmsSequence[];
};

export type SmsSequence = {
  id: string;
  campaign_id: string;
  interval: number;
  interval_type_id: number;
  position: number;
  text: string;
  active: boolean;
  url: string | null;
  short_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SmsSequencePayload = {
  interval: number;
  interval_type_id: number;
  text: string;
  active?: boolean;
  url?: string | null;
};

export type SmsProviderCampaignPayload = {
  name: string;
  active?: boolean;
  lead_list_id?: string | null;
  sequences?: SmsSequencePayload[];
};

export type SmsIntervalType = {
  id: number;
  name: string;
  type: string;
  label: string;
};

export const SMS_BROADCAST_STATUS_LABELS: Record<SmsBroadcastStatus, string> = {
  pending: "Pendente",
  scheduled: "Agendado",
  sending: "Enviando",
  sent: "Enviado",
  sent_with_errors: "Enviado com erros",
  cancelled: "Cancelado",
  sanitizing: "Sanitizando",
  importing: "Importando",
};

export const SMS_MESSAGE_STATUS_LABELS: Record<SmsMessageStatus, string> = {
  queued: "Na fila",
  sent: "Enviada",
  delivered: "Entregue",
  failed: "Falhou",
  undelivered: "Não entregue",
};

export const SMS_INTERVAL_TYPE_FALLBACK: SmsIntervalType[] = [
  { id: 1, name: "MINUTE", type: "MINUTE", label: "Minuto(s)" },
  { id: 2, name: "HOUR", type: "HOUR", label: "Hora(s)" },
  { id: 3, name: "DAY", type: "DAY", label: "Dia(s)" },
  { id: 4, name: "WEEK", type: "WEEK", label: "Semana(s)" },
  { id: 5, name: "MONTH", type: "MONTH", label: "Mês(ses)" },
];
