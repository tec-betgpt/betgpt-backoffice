import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import { getCampaignMonitor, getCampaignMonitorEvents } from "./campaignMonitor";

vi.mock("@/services/base", () => ({ default: { get: vi.fn() } }));
const mocked = api as unknown as { get: ReturnType<typeof vi.fn> };

describe("campaignMonitor service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca o monitor no projeto da campanha", async () => {
    const payload = { campaign_id: 10, channels: {}, history: [], errors: [] };
    mocked.get.mockResolvedValue({ data: payload });
    await expect(getCampaignMonitor(10, 4)).resolves.toEqual(payload);
    expect(mocked.get).toHaveBeenCalledWith("/campaigns/10/monitor", {
      params: { project_id: 4 },
    });
  });

  it("busca eventos por tipo e página", async () => {
    const payload = { campaign_id: 10, type: "opens", events: [], pagination: {} };
    mocked.get.mockResolvedValue({ data: payload });
    await expect(getCampaignMonitorEvents(10, 4, "opens", 2, 25)).resolves.toEqual(payload);
    expect(mocked.get).toHaveBeenCalledWith("/campaigns/10/monitor/events", {
      params: { project_id: 4, type: "opens", page: 2, per_page: 25 },
    });
  });
});
