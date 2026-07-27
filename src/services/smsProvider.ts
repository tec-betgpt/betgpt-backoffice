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

type FilterParams = {
  filter_id: string;
};

// ----------------------------------------------------------------------
// Mensagem de teste
// ----------------------------------------------------------------------

export async function sendTestMessage(
  payload: SmsTestMessagePayload & FilterParams,
): Promise<SmsSendResponse> {
  const { data } = await api.post<SmsProviderApiResponse<SmsSendResponse>>("/sms-provider/test-message", payload);
  return unwrap(data);
}

export async function getTestMessage(
  externalMessageId: string,
  params: FilterParams,
): Promise<SmsMessageDetail> {
  const { data } = await api.get<SmsProviderApiResponse<SmsMessageDetail>>(
    `/sms-provider/test-message/${externalMessageId}`,
    { params },
  );
  return unwrap(data);
}

// ----------------------------------------------------------------------
// Listas / leads
// ----------------------------------------------------------------------

export async function listSmsLists(
  params: FilterParams & { per_page?: number; page?: number },
): Promise<SmsProviderPagination<SmsList>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsList>>>("/sms-provider/lists", {
    params,
  });
  return unwrap(data);
}

export async function createSmsList(name: string, params: FilterParams): Promise<SmsList> {
  const { data } = await api.post<SmsProviderApiResponse<SmsList>>("/sms-provider/lists", {
    name,
    ...params,
  });
  return unwrap(data);
}

export async function updateSmsList(id: string, name: string, params: FilterParams): Promise<SmsList> {
  const { data } = await api.put<SmsProviderApiResponse<SmsList>>(`/sms-provider/lists/${id}`, {
    name,
    ...params,
  });
  return unwrap(data);
}

export async function deleteSmsList(id: string, params: FilterParams): Promise<void> {
  await api.delete(`/sms-provider/lists/${id}`, { params });
}

export async function listSmsLeads(
  listId: string,
  params: FilterParams & { per_page?: number; page?: number },
): Promise<SmsProviderPagination<SmsLead>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsLead>>>(
    `/sms-provider/lists/${listId}/leads`,
    { params },
  );
  return unwrap(data);
}

export async function addSmsLeads(
  listId: string,
  leads: SmsLeadPayload[],
  params: FilterParams,
): Promise<SmsAddLeadsResponse> {
  const { data } = await api.post<SmsProviderApiResponse<SmsAddLeadsResponse>>(
    `/sms-provider/lists/${listId}/leads`,
    { leads, ...params },
  );
  return unwrap(data);
}

export async function removeSmsLead(listId: string, leadId: string, params: FilterParams): Promise<void> {
  await api.delete(`/sms-provider/lists/${listId}/leads/${leadId}`, { params });
}

// ----------------------------------------------------------------------
// Campanhas do provedor (automações)
// ----------------------------------------------------------------------

export async function listSmsCampaigns(
  params: FilterParams & { per_page?: number; page?: number },
): Promise<SmsProviderPagination<SmsProviderCampaign>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsProviderCampaign>>>(
    "/sms-provider/campaigns",
    { params },
  );
  return unwrap(data);
}

export async function createSmsCampaign(
  payload: SmsProviderCampaignPayload & FilterParams,
): Promise<SmsProviderCampaign> {
  const { data } = await api.post<SmsProviderApiResponse<SmsProviderCampaign>>("/sms-provider/campaigns", payload);
  return unwrap(data);
}

export async function getSmsCampaign(id: string, params: FilterParams): Promise<SmsProviderCampaign> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderCampaign>>(`/sms-provider/campaigns/${id}`, {
    params,
  });
  return unwrap(data);
}

export async function updateSmsCampaign(
  id: string,
  payload: { name?: string; active?: boolean } & FilterParams,
): Promise<SmsProviderCampaign> {
  const { data } = await api.put<SmsProviderApiResponse<SmsProviderCampaign>>(
    `/sms-provider/campaigns/${id}`,
    payload,
  );
  return unwrap(data);
}

export async function deleteSmsCampaign(id: string, params: FilterParams): Promise<void> {
  await api.delete(`/sms-provider/campaigns/${id}`, { params });
}

// ----------------------------------------------------------------------
// Sequências
// ----------------------------------------------------------------------

export async function listSmsIntervalTypes(params: FilterParams): Promise<SmsIntervalType[]> {
  const { data } = await api.get<SmsProviderApiResponse<SmsIntervalType[]>>(
    "/sms-provider/sequences/interval-types",
    { params },
  );
  return unwrap(data);
}

export async function listSmsSequences(campaignId: string, params: FilterParams): Promise<SmsSequence[]> {
  const { data } = await api.get<SmsProviderApiResponse<SmsSequence[]>>(
    `/sms-provider/campaigns/${campaignId}/sequences`,
    { params },
  );
  return unwrap(data);
}

export async function createSmsSequence(
  campaignId: string,
  payload: SmsSequencePayload & FilterParams,
): Promise<SmsSequence> {
  const { data } = await api.post<SmsProviderApiResponse<SmsSequence>>(
    `/sms-provider/campaigns/${campaignId}/sequences`,
    payload,
  );
  return unwrap(data);
}

export async function updateSmsSequence(
  id: string,
  payload: Partial<SmsSequencePayload> & FilterParams,
): Promise<SmsSequence> {
  const { data } = await api.put<SmsProviderApiResponse<SmsSequence>>(`/sms-provider/sequences/${id}`, payload);
  return unwrap(data);
}

export async function deleteSmsSequence(id: string, params: FilterParams): Promise<void> {
  await api.delete(`/sms-provider/sequences/${id}`, { params });
}

// ----------------------------------------------------------------------
// Broadcasts
// ----------------------------------------------------------------------

export async function listSmsBroadcasts(
  params: FilterParams & {
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    text?: string | null;
    per_page?: number;
    page?: number;
  },
): Promise<SmsProviderPagination<SmsBroadcast>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsBroadcast>>>(
    "/sms-provider/broadcasts",
    { params },
  );
  return unwrap(data);
}

export async function getSmsBroadcast(id: string, params: FilterParams): Promise<SmsBroadcast> {
  const { data } = await api.get<SmsProviderApiResponse<SmsBroadcast>>(`/sms-provider/broadcasts/${id}`, {
    params,
  });
  return unwrap(data);
}

export async function listSmsBroadcastContacts(
  id: string,
  params: FilterParams & { phone?: string | null; per_page?: number; page?: number },
): Promise<SmsProviderPagination<SmsBroadcastContact>> {
  const { data } = await api.get<SmsProviderApiResponse<SmsProviderPagination<SmsBroadcastContact>>>(
    `/sms-provider/broadcasts/${id}/contacts`,
    { params },
  );
  return unwrap(data);
}

export async function cancelSmsBroadcast(id: string, params: FilterParams): Promise<SmsBroadcast> {
  const { data } = await api.put<SmsProviderApiResponse<SmsBroadcast>>(`/sms-provider/broadcasts/${id}/cancel`, params);
  return unwrap(data);
}
