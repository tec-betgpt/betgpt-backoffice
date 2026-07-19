import api from "./base.js";
import type {
  SmsAddLeadsResponse,
  SmsBroadcast,
  SmsBroadcastContact,
  SmsIntervalType,
  SmsLead,
  SmsLeadPayload,
  SmsList,
  SmsMessageDetail,
  SmsProviderApiResponse,
  SmsProviderCampaign,
  SmsProviderCampaignPayload,
  SmsProviderPagination,
  SmsSendResponse,
  SmsSequence,
  SmsSequencePayload,
  SmsTestMessagePayload,
} from "@/contracts/smsProvider";

function unwrap<T>(response: SmsProviderApiResponse<T>): T {
  return response.data as T;
}

// ----------------------------------------------------------------------
// Mensagem de teste
// ----------------------------------------------------------------------

export async function sendTestMessage(payload: SmsTestMessagePayload): Promise<SmsSendResponse> {
  const { data } = await api.post<SmsProviderApiResponse<SmsSendResponse>>("/sms-provider/test-message", payload);
  return unwrap(data);
}

export async function getTestMessage(externalMessageId: string): Promise<SmsMessageDetail> {
  const { data } = await api.get<SmsProviderApiResponse<SmsMessageDetail>>(
    `/sms-provider/test-message/${externalMessageId}`,
  );
  return unwrap(data);
}

// ----------------------------------------------------------------------
// Listas / leads
// ----------------------------------------------------------------------

export async function listSmsLists(params: { per_page?: number; page?: number } = {}): Promise<SmsProviderPagination<SmsList>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsList>>>("/sms-provider/lists", { params });
  return unwrap(data);
}

export async function createSmsList(name: string): Promise<SmsList> {
  const { data } = await api.post<SmsProviderApiResponse<SmsList>>("/sms-provider/lists", { name });
  return unwrap(data);
}

export async function updateSmsList(id: string, name: string): Promise<SmsList> {
  const { data } = await api.put<SmsProviderApiResponse<SmsList>>(`/sms-provider/lists/${id}`, { name });
  return unwrap(data);
}

export async function deleteSmsList(id: string): Promise<void> {
  await api.delete(`/sms-provider/lists/${id}`);
}

export async function listSmsLeads(
  listId: string,
  params: { per_page?: number; page?: number } = {},
): Promise<SmsProviderPagination<SmsLead>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsLead>>>(
    `/sms-provider/lists/${listId}/leads`,
    { params },
  );
  return unwrap(data);
}

export async function addSmsLeads(listId: string, leads: SmsLeadPayload[]): Promise<SmsAddLeadsResponse> {
  const { data } = await api.post<SmsProviderApiResponse<SmsAddLeadsResponse>>(
    `/sms-provider/lists/${listId}/leads`,
    { leads },
  );
  return unwrap(data);
}

export async function removeSmsLead(listId: string, leadId: string): Promise<void> {
  await api.delete(`/sms-provider/lists/${listId}/leads/${leadId}`);
}

// ----------------------------------------------------------------------
// Campanhas do provedor (automações)
// ----------------------------------------------------------------------

export async function listSmsCampaigns(
  params: { per_page?: number; page?: number } = {},
): Promise<SmsProviderPagination<SmsProviderCampaign>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsProviderCampaign>>>(
    "/sms-provider/campaigns",
    { params },
  );
  return unwrap(data);
}

export async function createSmsCampaign(payload: SmsProviderCampaignPayload): Promise<SmsProviderCampaign> {
  const { data } = await api.post<SmsProviderApiResponse<SmsProviderCampaign>>("/sms-provider/campaigns", payload);
  return unwrap(data);
}

export async function getSmsCampaign(id: string): Promise<SmsProviderCampaign> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderCampaign>>(`/sms-provider/campaigns/${id}`);
  return unwrap(data);
}

export async function updateSmsCampaign(
  id: string,
  payload: { name?: string; active?: boolean },
): Promise<SmsProviderCampaign> {
  const { data } = await api.put<SmsProviderApiResponse<SmsProviderCampaign>>(`/sms-provider/campaigns/${id}`, payload);
  return unwrap(data);
}

export async function deleteSmsCampaign(id: string): Promise<void> {
  await api.delete(`/sms-provider/campaigns/${id}`);
}

// ----------------------------------------------------------------------
// Sequências
// ----------------------------------------------------------------------

export async function listSmsIntervalTypes(): Promise<SmsIntervalType[]> {
  const { data } = await api.get<SmsProviderApiResponse<SmsIntervalType[]>>("/sms-provider/sequences/interval-types");
  return unwrap(data);
}

export async function listSmsSequences(campaignId: string): Promise<SmsSequence[]> {
  const { data } = await api.get<SmsProviderApiResponse<SmsSequence[]>>(
    `/sms-provider/campaigns/${campaignId}/sequences`,
  );
  return unwrap(data);
}

export async function createSmsSequence(campaignId: string, payload: SmsSequencePayload): Promise<SmsSequence> {
  const { data } = await api.post<SmsProviderApiResponse<SmsSequence>>(
    `/sms-provider/campaigns/${campaignId}/sequences`,
    payload,
  );
  return unwrap(data);
}

export async function updateSmsSequence(id: string, payload: Partial<SmsSequencePayload>): Promise<SmsSequence> {
  const { data } = await api.put<SmsProviderApiResponse<SmsSequence>>(`/sms-provider/sequences/${id}`, payload);
  return unwrap(data);
}

export async function deleteSmsSequence(id: string): Promise<void> {
  await api.delete(`/sms-provider/sequences/${id}`);
}

// ----------------------------------------------------------------------
// Broadcasts
// ----------------------------------------------------------------------

export async function listSmsBroadcasts(
  params: {
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    text?: string | null;
    per_page?: number;
    page?: number;
  } = {},
): Promise<SmsProviderPagination<SmsBroadcast>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsBroadcast>>>(
    "/sms-provider/broadcasts",
    { params },
  );
  return unwrap(data);
}

export async function getSmsBroadcast(id: string): Promise<SmsBroadcast> {
  const { data } = await api.get<SmsProviderApiResponse<SmsBroadcast>>(`/sms-provider/broadcasts/${id}`);
  return unwrap(data);
}

export async function listSmsBroadcastContacts(
  id: string,
  params: { phone?: string | null; per_page?: number; page?: number } = {},
): Promise<SmsProviderPagination<SmsBroadcastContact>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsBroadcastContact>>>(
    `/sms-provider/broadcasts/${id}/contacts`,
    { params },
  );
  return unwrap(data);
}

export async function cancelSmsBroadcast(id: string): Promise<SmsBroadcast> {
  const { data } = await api.put<SmsProviderApiResponse<SmsBroadcast>>(`/sms-provider/broadcasts/${id}/cancel`);
  return unwrap(data);
}
