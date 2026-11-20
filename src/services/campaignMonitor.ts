import api from "./base";
import type { CampaignApiResponse } from "@/contracts/campaigns";
import type { CampaignMonitorResponse } from "@/contracts/campaignMonitor";

function unwrap<T>(payload: T | CampaignApiResponse<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload &&
    (payload as CampaignApiResponse<T>).data !== undefined
  ) {
    return (payload as CampaignApiResponse<T>).data as T;
  }
  return payload as T;
}

export async function getCampaignMonitor(
  campaignId: number,
  projectId: number,
): Promise<CampaignMonitorResponse> {
  const { data } = await api.get<CampaignMonitorResponse | CampaignApiResponse<CampaignMonitorResponse>>(
    `/campaigns/${campaignId}/monitor`,
    { params: { project_id: projectId } },
  );
  return unwrap(data);
}

export default { getCampaignMonitor };
