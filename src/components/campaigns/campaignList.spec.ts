import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_LIST_TABS,
  campaignTabFilters,
  campaignTabFromFilters,
  groupCampaignsByUpdatedDate,
} from "./campaignList";
import type { CampaignListItem } from "@/contracts/campaigns";

describe("campaign list tabs", () => {
  it("oferece as seis abas na ordem esperada", () => {
    expect(CAMPAIGN_LIST_TABS.map((tab) => tab.label)).toEqual([
      "Todas",
      "Ativas",
      "Fluxos",
      "Agendadas",
      "Pausadas",
      "Rascunhos",
    ]);
  });

  it("mapeia cada aba para filtros da API", () => {
    expect(campaignTabFilters("all")).toEqual({ status: null, type: null, scheduled: null });
    expect(campaignTabFilters("running")).toEqual({ status: "running", type: null, scheduled: null });
    expect(campaignTabFilters("flow")).toEqual({ status: null, type: "flow", scheduled: null });
    expect(campaignTabFilters("scheduled")).toEqual({ status: null, type: null, scheduled: true });
    expect(campaignTabFilters("paused")).toEqual({ status: "paused", type: null, scheduled: null });
    expect(campaignTabFilters("draft")).toEqual({ status: "draft", type: null, scheduled: null });
  });

  it("resolve a aba ativa a partir dos filtros manuais", () => {
    expect(campaignTabFromFilters({ status: "draft" })).toBe("draft");
    expect(campaignTabFromFilters({ type: "flow" })).toBe("flow");
    expect(campaignTabFromFilters({ scheduled: true })).toBe("scheduled");
    expect(campaignTabFromFilters({ status: "completed" })).toBe("all");
  });

  it("agrupa os cards pela data local da última alteração", () => {
    const now = new Date(2026, 10, 21, 12);
    const items = [
      { id: 1, updated_at: new Date(2026, 10, 21, 9).toISOString() },
      { id: 2, updated_at: new Date(2026, 10, 20, 18).toISOString() },
      { id: 3, updated_at: new Date(2026, 10, 21, 11).toISOString() },
      { id: 4, updated_at: new Date(2026, 10, 14, 10).toISOString() },
      { id: 5, updated_at: new Date(2026, 10, 4, 10).toISOString() },
    ] as CampaignListItem[];

    const groups = groupCampaignsByUpdatedDate(items, now);
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ["Hoje", [1, 3]],
      ["Ontem", [2]],
      ["7 dias atrás", [4]],
      ["04/11/2026", [5]],
    ]);
  });
});
