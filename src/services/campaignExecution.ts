import api from "./base.js";
import { postWithIdempotency } from "./idempotency";
import type { CampaignApiResponse } from "@/contracts/campaigns";
import type {
  CampaignPrepareResponse,
  CampaignRunActionResponse,
  CampaignRunRecipientsFilters,
  CampaignRunRecipientsResponse,
  CampaignRunWithWaves,
} from "@/contracts/campaignExecution";

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

export async function prepare(campaignId: number): Promise<CampaignPrepareResponse> {
  const data = await postWithIdempotency<CampaignPrepareResponse | CampaignApiResponse<CampaignPrepareResponse>>(
    `/campaigns/${campaignId}/prepare`,
  );
  return unwrapResponse(data);
}

export async function launch(campaignId: number): Promise<CampaignRunActionResponse> {
  const data = await postWithIdempotency<CampaignRunActionResponse | CampaignApiResponse<CampaignRunActionResponse>>(
    `/campaigns/${campaignId}/launch`,
  );
  return unwrapResponse(data);
}

export async function pause(campaignId: number): Promise<CampaignRunActionResponse> {
  const data = await postWithIdempotency<CampaignRunActionResponse | CampaignApiResponse<CampaignRunActionResponse>>(
    `/campaigns/${campaignId}/pause`,
  );
  return unwrapResponse(data);
}

export async function resume(campaignId: number): Promise<CampaignRunActionResponse> {
  const data = await postWithIdempotency<CampaignRunActionResponse | CampaignApiResponse<CampaignRunActionResponse>>(
    `/campaigns/${campaignId}/resume`,
  );
  return unwrapResponse(data);
}

export async function cancel(campaignId: number): Promise<CampaignRunActionResponse> {
  const data = await postWithIdempotency<CampaignRunActionResponse | CampaignApiResponse<CampaignRunActionResponse>>(
    `/campaigns/${campaignId}/cancel`,
  );
  return unwrapResponse(data);
}

export async function getRun(campaignId: number): Promise<CampaignRunWithWaves> {
  const { data } = await api.get<CampaignRunWithWaves | CampaignApiResponse<CampaignRunWithWaves>>(
    `/campaigns/${campaignId}/run`,
  );
  return unwrapResponse(data);
}

export async function getRunBatches(campaignId: number): Promise<CampaignRunWithWaves> {
  const { data } = await api.get<CampaignRunWithWaves | CampaignApiResponse<CampaignRunWithWaves>>(
    `/campaigns/${campaignId}/run/batches`,
  );
  return unwrapResponse(data);
}

export async function getRunRecipients(
  campaignId: number,
  filters: CampaignRunRecipientsFilters = {},
): Promise<CampaignRunRecipientsResponse> {
  const { data } = await api.get<
    CampaignRunRecipientsResponse | CampaignApiResponse<CampaignRunRecipientsResponse>
  >(`/campaigns/${campaignId}/run/recipients`, { params: filters });
  return unwrapResponse(data);
}

const campaignExecutionService = {
  prepare,
  launch,
  pause,
  resume,
  cancel,
  getRun,
  getRunBatches,
  getRunRecipients,
};

export default campaignExecutionService;
