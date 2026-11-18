import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_LIST_TABS,
  campaignTabFilters,
  campaignTabFromFilters,
} from "./campaignList";

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
});
