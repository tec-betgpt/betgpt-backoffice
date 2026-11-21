import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import { createCampaign, getCampaignSummary, listCampaigns, updateCampaign } from "./campaigns";

vi.mock("@/services/base", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
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

  it("deriva o agendamento de recorrência e data inicial no payload", async () => {
    mocked.post.mockResolvedValue({ data: { id: 1 } });
    mocked.put.mockResolvedValue({});

    await createCampaign({
      project_id: 4,
      name: "Imediata",
      schedule: { schedule_type: "scheduled", starts_at: null },
      recurrence_policy: { is_enabled: false },
    });
    expect(mocked.post).toHaveBeenLastCalledWith("/campaigns", expect.objectContaining({
      schedule: expect.objectContaining({ schedule_type: "immediate" }),
    }), expect.any(Object));

    await updateCampaign(1, {
      schedule: { schedule_type: "immediate", starts_at: "2026-11-22T10:00" },
      recurrence_policy: { is_enabled: false },
    });
    expect(mocked.put).toHaveBeenLastCalledWith("/campaigns/1", expect.objectContaining({
      schedule: expect.objectContaining({ schedule_type: "scheduled" }),
    }));

    await updateCampaign(1, {
      schedule: { schedule_type: "immediate", starts_at: null },
      recurrence_policy: { is_enabled: true },
    });
    expect(mocked.put).toHaveBeenLastCalledWith("/campaigns/1", expect.objectContaining({
      schedule: expect.objectContaining({ schedule_type: "recurring" }),
    }));
  });

  it("normaliza horários HH:MM para HH:MM:SS na criação e atualização", async () => {
    mocked.post.mockResolvedValue({ data: { id: 1 } });
    mocked.put.mockResolvedValue({});
    const delivery_windows = [
      { starts_at: "10:00", ends_at: "18:00", is_active: true },
      { starts_at: "11:00:00", ends_at: "19:00:00", is_active: true },
    ];

    await createCampaign({ project_id: 4, name: "Campanha", delivery_windows });
    expect(mocked.post).toHaveBeenCalledWith("/campaigns", expect.objectContaining({
      delivery_windows: [
        { starts_at: "10:00:00", ends_at: "18:00:00", is_active: true },
        { starts_at: "11:00:00", ends_at: "19:00:00", is_active: true },
      ],
    }), expect.any(Object));

    await updateCampaign(1, { delivery_windows });
    expect(mocked.put).toHaveBeenCalledWith("/campaigns/1", {
      delivery_windows: [
        { starts_at: "10:00:00", ends_at: "18:00:00", is_active: true },
        { starts_at: "11:00:00", ends_at: "19:00:00", is_active: true },
      ],
    });
  });
});
