import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import CampaignSingleStageConfigurator from "./CampaignSingleStageConfigurator.vue";
import type { CampaignFormState } from "@/contracts/campaigns";

const stubs = {
  CampaignChannelsStep: { template: '<div data-test="channels-step" />' },
  CampaignLinksStep: { template: "<div />" },
  CampaignRecurrenceStep: { template: "<div />" },
  CampaignWarmupStep: { template: "<div />" },
  CampaignDeliveryWindowsStep: { template: "<div />" },
  CampaignSingleStageStep: { template: "<div />" },
  CampaignBasicStep: { template: "<div />" },
  CampaignScheduleStep: { template: "<div />" },
  CampaignEstimatePanel: { template: "<div />" },
  CampaignChecklistPanel: { template: "<div />" },
};

function form(): CampaignFormState {
  return {
    name: "Campanha",
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

function mountConfigurator(activeStep = "message") {
  return mount(CampaignSingleStageConfigurator, {
    props: {
      modelValue: form(),
      activeStep,
      stepLoading: {},
      projectId: 1,
      detectedLinks: [],
      readonly: false,
      isSaving: false,
      sectionErrors: () => [],
      sectionWarnings: () => [],
      allErrors: [],
      allWarnings: [],
      estimate: null,
      estimateErrorMessage: "",
      campaignId: 1,
      onRefreshEstimate: () => {},
      validation: null,
    },
    global: { stubs },
  });
}

describe("CampaignSingleStageConfigurator", () => {
  it("renderiza as três etapas e as tabs do DeltaCRM", () => {
    const wrapper = mountConfigurator();
    for (const text of [
      "Tipo de campanha",
      "Configurar",
      "Finalizar",
      "Canais",
      "Repetição",
      "Dias",
      "Segmento",
      "Agendar",
      "Giros",
      "Promoções",
    ]) {
      expect(wrapper.text()).toContain(text);
    }
    expect(wrapper.find('[data-test="channels-step"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Salvar e continuar");
  });

  it("mapeia a tab Repetição para a etapa de recorrência", async () => {
    const Parent = defineComponent({
      components: { CampaignSingleStageConfigurator },
      setup() {
        const activeStep = ref("message");
        return { activeStep };
      },
      template: `
        <CampaignSingleStageConfigurator
          v-model:active-step="activeStep"
          :model-value="formValue"
          :step-loading="{}"
          :project-id="1"
          :detected-links="[]"
          :section-errors="() => []"
          :section-warnings="() => []"
          :all-errors="[]"
          :all-warnings="[]"
          :estimate="null"
          estimate-error-message=""
          :campaign-id="1"
          :on-refresh-estimate="() => {}"
          :validation="null"
        />`,
      computed: {
        formValue() {
          return form();
        },
      },
    });
    const wrapper = mount(Parent, { global: { stubs } });
       const repetition = wrapper.findAll("button").find((button) => button.text() === "Repetição");
    await repetition!.trigger("click");
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.activeStep).toBe("recurrence_policy");
  });
});
