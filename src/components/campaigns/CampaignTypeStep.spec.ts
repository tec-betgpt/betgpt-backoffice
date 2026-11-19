import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import CampaignTypeStep from "./CampaignTypeStep.vue";
import type { CampaignFormState } from "@/contracts/campaigns";

function form(): CampaignFormState {
  return {
    name: "",
    description: null,
    type: "broadcast",
    channel: "sms",
    metadata: null,
    single_stage_config: {},
    flow_config: null,
    message: {},
    messages: [],
    links: [],
    schedule: {},
    delivery_windows: [],
    recurrence_policy: {},
    warmup_policy: {},
  };
}

describe("CampaignTypeStep", () => {
  it("só permite avançar com nome e estágio selecionados", async () => {
    const wrapper = mount(CampaignTypeStep, {
      props: { modelValue: form(), errors: [], warnings: [] },
    });
    const next = () => wrapper.findAll("button").find((button) => button.text().includes("Próxima etapa"))!;
    expect(next().attributes("disabled")).toBeDefined();

    await wrapper.get('input[placeholder="Campanha de retenção"]').setValue("Retenção");
    const singleStage = wrapper.findAll("button").find((button) => button.text().includes("Estágio único"))!;
    await singleStage.trigger("click");
    expect(next().attributes("disabled")).toBeUndefined();

    await next().trigger("click");
    expect(wrapper.emitted("continue")).toHaveLength(1);

    await wrapper.get('input[placeholder="Campanha de retenção"]').setValue("   ");
    expect(next().attributes("disabled")).toBeDefined();
  });
});
