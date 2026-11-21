import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import CampaignValidationList from "./CampaignValidationList.vue";
import { groupCampaignValidationItems } from "./campaignValidation";

const errors = [
  { field: "messages.0.body", step: "message", message: "Informe a mensagem" },
  { field: "schedule.starts_at", step: "schedule", message: "Informe a data" },
  { field: "schedule.timezone", step: "schedule", message: "Informe o timezone" },
];

describe("campaign validation", () => {
  it("agrupa erros por etapa e resume quantidades", () => {
    const groups = groupCampaignValidationItems(errors);
    expect(groups.map((group) => [group.label, group.items.length])).toEqual([
      ["Canais", 1],
      ["Agendamento", 2],
    ]);
  });

  it("exibe nomes legíveis sem expor chaves técnicas", () => {
    const wrapper = mount(CampaignValidationList, { props: { errors } });
    expect(wrapper.text()).toContain("Conteúdo da mensagem");
    expect(wrapper.text()).toContain("Data e hora de início");
    expect(wrapper.text()).toContain("Fuso horário");
    expect(wrapper.text()).not.toContain("messages.0.body");
    expect(wrapper.text()).not.toContain("schedule.starts_at");
  });

  it("emite navegação ao clicar na etapa", async () => {
    const wrapper = mount(CampaignValidationList, { props: { errors } });
    const button = wrapper.findAll("button").find((item) => item.text() === "Agendamento (2)");
    await button!.trigger("click");
    expect(wrapper.emitted("navigate")?.[0]).toEqual(["schedule"]);
  });

  it("usa a navegação fornecida pelo wizard", async () => {
    const navigate = vi.fn();
    const wrapper = mount(CampaignValidationList, {
      props: { errors },
      global: { provide: { campaignValidationNavigate: navigate } },
    });
    const button = wrapper.findAll("button").find((item) => item.text() === "Canais (1)");
    await button!.trigger("click");
    expect(navigate).toHaveBeenCalledWith("message");
    expect(wrapper.emitted("navigate")).toBeUndefined();
  });
});
