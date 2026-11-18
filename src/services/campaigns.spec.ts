import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import { getCampaignSummary, listCampaigns } from "./campaigns";

vi.mock("@/services/base", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("campaigns service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca KPIs por projeto e período", async () => {
    const summary = { kpis: {}, status_counts: {} };
    mocked.get.mockResolvedValue({ data: { success: true, data: summary } });
    await expect(getCampaignSummary(4, "7d")).resolves.toEqual(summary);
    expect(mocked.get).toHaveBeenCalledWith("/campaigns/summary", {
      params: { project_id: 4, period: "7d" },
    });
  });

  it("mantém filtros de status, tipo e agendamento na listagem", async () => {
    const payload = { data: [], current_page: 1, last_page: 1, total: 0 };
    mocked.get.mockResolvedValue({ data: payload });
    await expect(listCampaigns({ project_id: 4, status: "draft", scheduled: true })).resolves.toEqual(payload);
    expect(mocked.get).toHaveBeenCalledWith("/campaigns", {
      params: { project_id: 4, status: "draft", scheduled: true },
    });
  });
});
