import type { CampaignListItem, CampaignStatus, CampaignType } from "@/contracts/campaigns";

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

export type CampaignDateGroup = {
  key: string;
  label: string;
  items: CampaignListItem[];
};

export function groupCampaignsByUpdatedDate(items: CampaignListItem[], now = new Date()): CampaignDateGroup[] {
  const groups = new Map<string, CampaignListItem[]>();

  for (const item of items) {
    const key = campaignDateKey(item.updated_at);
    groups.set(key, [...(groups.get(key) || []), item]);
  }

  return Array.from(groups.entries()).map(([key, groupedItems]) => ({
    key,
    label: campaignDateGroupLabel(key, now),
    items: groupedItems,
  }));
}

export function campaignDateGroupLabel(key: string, now = new Date()): string {
  if (key === "sem-data") return "Sem data de alteração";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === campaignDateKey(now.toISOString())) return "Hoje";
  if (key === campaignDateKey(yesterday.toISOString())) return "Ontem";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${key}T12:00:00`));
}

function campaignDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "sem-data";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
