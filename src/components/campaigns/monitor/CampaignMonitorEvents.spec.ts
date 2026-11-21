import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import CampaignMonitorEvents from "./CampaignMonitorEvents.vue";
import type { CampaignMonitorEventsResponse } from "@/contracts/campaignMonitor";
import { getCampaignMonitorEvents } from "@/services/campaignMonitor";

const getEventsMock = vi.hoisted(() => vi.fn());
vi.mock("@/services/campaignMonitor", () => ({ getCampaignMonitorEvents: getEventsMock }));

function response(page: number): CampaignMonitorEventsResponse {
  return {
    campaign_id: 1,
    type: "opens",
    events: [{
      id: `event-${page}`,
      source: "campaign_event",
      event_type: "email.opened",
      channel: "email",
      contact: "player@example.test",
      player_id: 10,
      occurred_at: "2026-11-21T12:00:00.000Z",
    }],
    pagination: { current_page: page, last_page: 2, per_page: 1, total: 2 },
  };
}

describe("CampaignMonitorEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEventsMock.mockImplementation((_campaignId, _projectId, _type, page) => Promise.resolve(response(page)));
  });

  it("carrega somente quando ativa e pagina no backend", async () => {
    const wrapper = mount(CampaignMonitorEvents, {
      props: { campaignId: 1, projectId: 7, type: "opens", title: "Aberturas", active: false },
    });
    expect(getEventsMock).not.toHaveBeenCalled();

    await wrapper.setProps({ active: true });
    await flushPromises();
    expect(getEventsMock).toHaveBeenCalledWith(1, 7, "opens", 1);
    expect(wrapper.text()).toContain("player@example.test");
    expect(wrapper.text()).toContain("Página 1 de 2");

    const next = wrapper.findAll("button").find((button) => button.text() === "Próxima");
    await next!.trigger("click");
    await flushPromises();
    expect(getEventsMock).toHaveBeenCalledWith(1, 7, "opens", 2);
    expect(wrapper.text()).toContain("Página 2 de 2");
  });
});
