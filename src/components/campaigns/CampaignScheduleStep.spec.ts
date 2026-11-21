import { describe, expect, it } from "vitest";
import { defineComponent, ref } from "vue";
import { mount } from "@vue/test-utils";
import CampaignScheduleStep from "./CampaignScheduleStep.vue";
import type { CampaignSchedulePayload } from "@/contracts/campaigns";

describe("CampaignScheduleStep", () => {
  it("remove o seletor de tipo e deriva o estado pela data inicial", async () => {
    const Parent = defineComponent({
      components: { CampaignScheduleStep },
      setup() {
        const schedule = ref<CampaignSchedulePayload>({
          schedule_type: "immediate",
          starts_at: null,
          timezone: "America/Sao_Paulo",
        });
        return { schedule };
      },
      template: '<CampaignScheduleStep v-model="schedule" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.text()).not.toContain("Tipo de agendamento");

    const startsAt = wrapper.find('input[type="datetime-local"]');
    await startsAt.setValue("2026-11-22T10:00");
    expect(wrapper.vm.schedule.schedule_type).toBe("scheduled");
    await startsAt.setValue("");
    expect(wrapper.vm.schedule.schedule_type).toBe("immediate");
  });
});
