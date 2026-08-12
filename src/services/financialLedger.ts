import api from "./base.js";
import type {
  CampaignCostsResponse,
  LedgerListResponse,
  LedgerParams,
  ResourceUsageParams,
  ResourceUsageResponse,
} from "@/contracts/financialLedger";

function unwrapResponse<T>(response: T | { success?: boolean; data?: T }): T {
  if (response && typeof response === "object" && "success" in response && "data" in response && response.data !== undefined) {
    return response.data;
  }
  return response as T;
}

export async function getCampaignCosts(campaignId: number): Promise<CampaignCostsResponse> {
  const { data } = await api.get<CampaignCostsResponse | { success?: boolean; data?: CampaignCostsResponse }>(
    `/campaigns/${campaignId}/costs`,
  );
  return unwrapResponse(data);
}

export async function getResourceUsage(params: ResourceUsageParams = {}): Promise<ResourceUsageResponse> {
  const { data } = await api.get<ResourceUsageResponse | { success?: boolean; data?: ResourceUsageResponse }>(
    "/financial/resource-usage",
    { params },
  );
  return unwrapResponse(data);
}

export async function getLedger(params: LedgerParams = {}): Promise<LedgerListResponse> {
  const { data } = await api.get<LedgerListResponse>("/financial/ledger", { params });
  return data;
}

export default {
  getCampaignCosts,
  getResourceUsage,
  getLedger,
  campaignCosts: getCampaignCosts,
  resourceUsage: getResourceUsage,
  ledger: getLedger,
};
