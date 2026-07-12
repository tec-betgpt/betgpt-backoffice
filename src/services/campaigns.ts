import api from "./base.js";
import type {
  CampaignApiResponse,
  CampaignDetail,
  CampaignEstimateResponse,
  CampaignListParams,
  CampaignListResponse,
  CampaignStorePayload,
  CampaignUpdatePayload,
  CampaignValidationResponse,
} from "@/contracts/campaigns";

function unwrapResponse<T>(response: T | CampaignApiResponse<T>): T {
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

export async function listCampaigns(params: CampaignListParams = {}): Promise<CampaignListResponse> {
  const { data } = await api.get<CampaignListResponse | CampaignApiResponse<CampaignListResponse>>("/campaigns", {
    params,
  });
  return unwrapResponse(data);
}

export async function createCampaign(payload: CampaignStorePayload): Promise<CampaignDetail> {
  const { data } = await api.post<CampaignDetail | CampaignApiResponse<CampaignDetail>>("/campaigns", payload);
  return unwrapResponse(data);
}

export async function getCampaign(id: number): Promise<CampaignDetail> {
  const { data } = await api.get<CampaignDetail | CampaignApiResponse<CampaignDetail>>(`/campaigns/${id}`);
  return unwrapResponse(data);
}

export async function updateCampaign(id: number, payload: CampaignUpdatePayload): Promise<void> {
  await api.put(`/campaigns/${id}`, payload);
}

export async function deleteCampaign(id: number): Promise<void> {
  await api.delete(`/campaigns/${id}`);
}

export async function validateCampaign(id: number): Promise<CampaignValidationResponse> {
  const { data } = await api.post<CampaignValidationResponse | CampaignApiResponse<CampaignValidationResponse>>(
    `/campaigns/${id}/validate-configuration`,
  );
  return unwrapResponse(data);
}

export async function estimateCampaign(id: number): Promise<CampaignEstimateResponse> {
  const { data } = await api.post<CampaignEstimateResponse | CampaignApiResponse<CampaignEstimateResponse>>(
    `/campaigns/${id}/estimate`,
  );
  return unwrapResponse(data);
}

export default {
  index: listCampaigns,
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  validateCampaign,
  estimateCampaign,
  store: createCampaign,
  show: getCampaign,
  update: updateCampaign,
  destroy: deleteCampaign,
  validateConfiguration: validateCampaign,
  estimate: estimateCampaign,
};
