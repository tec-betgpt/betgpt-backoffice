import api from "./base.js";
import type {
  CampaignDetail,
  CampaignStorePayload,
  CampaignUpdatePayload,
  CampaignValidationResponse,
} from "@/contracts/campaigns";

type ApiWrappedResponse<T> = {
  success?: boolean;
  message?: string | null;
  data?: T;
};

const unwrapDetail = (response: CampaignDetail | ApiWrappedResponse<CampaignDetail>): CampaignDetail => {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data;
  }

  return response as CampaignDetail;
};

export async function createCampaign(payload: CampaignStorePayload): Promise<CampaignDetail> {
  const { data } = await api.post<CampaignDetail | ApiWrappedResponse<CampaignDetail>>("/campaigns", payload);
  return unwrapDetail(data);
}

export async function getCampaign(id: number): Promise<CampaignDetail> {
  const { data } = await api.get<CampaignDetail | ApiWrappedResponse<CampaignDetail>>(`/campaigns/${id}`);
  return unwrapDetail(data);
}

export async function updateCampaign(id: number, payload: CampaignUpdatePayload): Promise<void> {
  await api.put(`/campaigns/${id}`, payload);
}

export async function validateCampaign(id: number): Promise<CampaignValidationResponse["data"]> {
  const { data } = await api.post<CampaignValidationResponse>(`/campaigns/${id}/validate-configuration`);
  return data.data;
}

export default {
  createCampaign,
  getCampaign,
  updateCampaign,
  validateCampaign,
  store: createCampaign,
  show: getCampaign,
  update: updateCampaign,
  validateConfiguration: validateCampaign,
};
