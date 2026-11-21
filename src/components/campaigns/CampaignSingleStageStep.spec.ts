import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import CampaignSingleStageStep from "./CampaignSingleStageStep.vue";
import type { CampaignSingleStageConfigPayload } from "@/contracts/campaigns";
import TargetAudience from "@/services/targetAudience";
import { previewCampaignAudience } from "@/services/campaigns";
import { useWorkspaceStore } from "@/stores/workspace";

vi.mock("@/services/targetAudience", () => ({
  default: { list: vi.fn() },
}));
vi.mock("@/services/campaigns", () => ({
  previewCampaignAudience: vi.fn(),
}));

function form(): CampaignSingleStageConfigPayload {
  return {
    target_audience_id: null,
    target_audience_ids: [],
    audience_mode: "fixed",
    apply_protection_list: false,
    apply_opt_out: false,
    apply_suppression: false,
  };
}

describe("CampaignSingleStageStep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    const workspace = useWorkspaceStore();
    workspace.activeGroupProject = {
      id: "project_1",
      project_id: "1",
      is_selected: true,
      label: "Projeto",
      logo: null,
      name: "Projeto",
      type: "project",
    };
    vi.mocked(TargetAudience.list).mockResolvedValue([
      { id: 1, name: "Segmento A", players: 5 },
      { id: 2, name: "Segmento B", players: 4 },
    ] as any);
    vi.mocked(previewCampaignAudience).mockResolvedValue({
      segments: [
        { id: 1, target_audience_id: 1, name: "Segmento A", total_eligible: 2, error: null },
        { id: 2, target_audience_id: 2, name: "Segmento B", total_eligible: 1, error: null },
      ],
      total_eligible: 2,
    });
  });

  it("adiciona/remove segmentos e mostra contagem individual e total único", async () => {
    const model = form();
    const wrapper = mount(CampaignSingleStageStep, {
      props: { modelValue: model, channel: "sms", errors: [], warnings: [] },
    });
    await flushPromises();

    const select = wrapper.findAll("select")[0];
    await select.setValue("1");
    await wrapper.findAll("button").find((button) => button.text() === "+ Adicionar segmento")!.trigger("click");
    expect(model.target_audience_ids).toEqual([1]);
    expect(model.target_audience_id).toBe(1);

    await select.setValue("2");
    await wrapper.findAll("button").find((button) => button.text() === "+ Adicionar segmento")!.trigger("click");
    expect(model.target_audience_ids).toEqual([1, 2]);

    await vi.advanceTimersByTimeAsync(400);
    await flushPromises();
    expect(previewCampaignAudience).toHaveBeenCalledWith(expect.objectContaining({
      project_id: 1,
      target_audience_ids: [1, 2],
    }));
    expect(wrapper.text()).toContain("Total elegível único da campanha");
    expect(wrapper.text()).toContain("2 elegíveis");

    await wrapper.findAll("button").find((button) => button.text() === "Remover")!.trigger("click");
    expect(model.target_audience_ids).toEqual([2]);
    expect(model.target_audience_id).toBe(2);
    wrapper.unmount();
    vi.useRealTimers();
  });
});
