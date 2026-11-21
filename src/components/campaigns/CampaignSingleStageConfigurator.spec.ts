import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick, reactive, ref } from "vue";
import CampaignSingleStageConfigurator from "./CampaignSingleStageConfigurator.vue";
import type { CampaignFormState } from "@/contracts/campaigns";

const stubs = {
  CampaignChannelsStep: { template: '<div data-test="channels-step" />' },
  CampaignRecurrenceStep: { template: '<div data-test="recurrence-step" />' },
  CampaignWarmupStep: { template: '<div data-test="warmup-step" />' },
  CampaignDeliveryWindowsStep: { template: '<div data-test="days-step" />' },
  CampaignSingleStageStep: { template: '<div data-test="segment-step" />' },
  CampaignBasicStep: { template: '<div data-test="basic-step" />' },
  CampaignScheduleStep: { template: '<div data-test="schedule-step" />' },
  CampaignEstimatePanel: { template: '<div data-test="estimate-panel" />' },
  CampaignChecklistPanel: { template: '<div data-test="checklist-panel" />' },
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
    schedule: { schedule_type: "immediate", starts_at: null },
    delivery_windows: [],
    recurrence_policy: { is_enabled: false },
    warmup_policy: {},
  };
}

function mountConfigurator(activeStep = "message", modelValue = form()) {
  return mount(CampaignSingleStageConfigurator, {
    props: {
      modelValue,
      activeStep,
      stepLoading: {},
      projectId: 1,
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
  it("renderiza somente as tabs pertencentes ao produto", () => {
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
      "Warmup",
    ]) {
      expect(wrapper.text()).toContain(text);
    }
    expect(wrapper.text()).not.toContain("Giros");
    expect(wrapper.text()).not.toContain("Promoções");
    expect(wrapper.text()).not.toContain("Links");
    expect(wrapper.find('[data-test="channels-step"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Salvar e continuar");
  });

  it("mapeia as tabs para suas etapas e mantém Warmup separado", async () => {
    const wrapper = mountConfigurator("warmup_policy");
    expect(wrapper.find('[data-test="warmup-step"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="recurrence-step"]').exists()).toBe(false);

    const repetition = wrapper.findAll("button").find((button) => button.text() === "Repetição");
    await repetition!.trigger("click");
    expect(wrapper.emitted("update:activeStep")?.at(-1)).toEqual(["recurrence_policy"]);
  });

  it("avança de Warmup para uma etapa Finalizar independente", async () => {
    const wrapper = mountConfigurator("warmup_policy");
    const save = wrapper.findAll("button").find((button) => button.text() === "Salvar e continuar");
    await save!.trigger("click");
    expect(wrapper.emitted("save-continue")).toEqual([["review"]]);

    const review = mountConfigurator("review");
    expect(review.text()).toContain("Finalizar campanha");
    expect(review.find('[data-test="estimate-panel"]').exists()).toBe(true);
    expect(review.text()).not.toContain("Salvar e continuar");
    const back = review.findAll("button").find((button) => button.text() === "Voltar");
    await back!.trigger("click");
    expect(review.emitted("update:activeStep")?.at(-1)).toEqual(["warmup_policy"]);
  });

  it("sincroniza o agendamento ao ativar e desativar a recorrência", async () => {
    const modelValue = reactive(form());
    mountConfigurator("recurrence_policy", modelValue);
    modelValue.recurrence_policy.is_enabled = true;
    await nextTick();
    expect(modelValue.schedule.schedule_type).toBe("recurring");

    modelValue.recurrence_policy.is_enabled = false;
    await nextTick();
    expect(modelValue.schedule.schedule_type).toBe("immediate");

    modelValue.schedule.starts_at = "2026-11-22T10:00";
    modelValue.recurrence_policy.is_enabled = true;
    await nextTick();
    expect(modelValue.schedule.schedule_type).toBe("recurring");
    modelValue.recurrence_policy.is_enabled = false;
    await nextTick();
    expect(modelValue.schedule.schedule_type).toBe("scheduled");
  });

  it("mantém o mapeamento da tab Repetição com v-model do wizard", async () => {
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
