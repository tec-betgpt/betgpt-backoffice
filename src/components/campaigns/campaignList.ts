import type { CampaignStatus, CampaignType } from "@/contracts/campaigns";

export type CampaignListTab = "all" | "running" | "flow" | "scheduled" | "paused" | "draft";

export const CAMPAIGN_LIST_TABS: Array<{
  key: CampaignListTab;
  label: string;
}> = [
  { key: "all", label: "Todas" },
  { key: "running", label: "Ativas" },
  { key: "flow", label: "Fluxos" },
  { key: "scheduled", label: "Agendadas" },
  { key: "paused", label: "Pausadas" },
  { key: "draft", label: "Rascunhos" },
];

export function campaignTabFilters(tab: CampaignListTab): {
  status: CampaignStatus | null;
  type: CampaignType | null;
  scheduled: boolean | null;
} {
  return {
    status: ["running", "paused", "draft"].includes(tab) ? tab as CampaignStatus : null,
    type: tab === "flow" ? "flow" : null,
    scheduled: tab === "scheduled" ? true : null,
  };
}

export function campaignTabFromFilters(filters: {
  status?: CampaignStatus | null;
  type?: CampaignType | null;
  scheduled?: boolean | null;
}): CampaignListTab {
  if (filters.scheduled) return "scheduled";
  if (filters.type === "flow") return "flow";
  if (filters.status === "running" || filters.status === "paused" || filters.status === "draft") {
    return filters.status;
  }
  return "all";
}
