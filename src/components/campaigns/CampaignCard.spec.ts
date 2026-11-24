import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import CampaignCard from "./CampaignCard.vue";
import type { CampaignListItem } from "@/contracts/campaigns";

function campaign(overrides: Partial<CampaignListItem> = {}): CampaignListItem {
  return {
    id: 10,
    uuid: "campaign-10",
    project_id: 1,
    user_project_group_id: null,
    created_by: null,
    updated_by: null,
    name: "Campanha VIP",
    description: "Reativação de jogadores",
    type: "broadcast",
    channel: "sms",
    status: "draft",
    validated_at: null,
    archived_at: null,
    created_at: "2026-11-20T12:00:00.000Z",
    updated_at: "2026-11-21T14:30:00.000Z",
    channels: ["sms", "whatsapp"],
    metrics: { sends: 12, opens: 5, clicks: 3, conversions: 2 },
    last_sent_at: "2026-11-21T13:00:00.000Z",
    target_audiences: [{ id: 1, name: "VIP" }, { id: 2, name: "Reativação" }],
    recurrence_policy: { is_enabled: true, frequency: "weekly", interval: 2 },
    ...overrides,
  };
}

const menuStubs = {
  DropdownMenu: { template: "<div><slot /></div>" },
  DropdownMenuTrigger: { template: "<div><slot /></div>" },
  DropdownMenuContent: { template: "<div><slot /></div>" },
  DropdownMenuSeparator: { template: "<hr />" },
  DropdownMenuItem: { emits: ["select"], template: '<button type="button" @click.stop="$emit(\'select\')"><slot /></button>' },
};

function mountCard(item: CampaignListItem) {
  return mount(CampaignCard, { props: { campaign: item }, global: { stubs: menuStubs } });
}

function menuItem(wrapper: ReturnType<typeof mountCard>, label: string) {
  const item = wrapper.findAll("button").find((button) => button.text().includes(label));
  if (!item) throw new Error(`Item "${label}" não encontrado`);
  return item;
}

describe("CampaignCard", () => {
  it("apresenta métricas com taxas, segmentos, recorrência e ações do rascunho", async () => {
    const wrapper = mountCard(campaign());
    expect(wrapper.text()).toContain("Rascunho");
    expect(wrapper.text()).toContain("Campanha VIP");
    expect(wrapper.text()).toContain("12");
    expect(wrapper.text()).toContain("(41,7%)");
    expect(wrapper.text()).toContain("VIP +1");
    expect(wrapper.text()).toContain("A cada 2 semanas");
    expect(wrapper.text()).toContain("SMS");
    expect(wrapper.text()).toContain("Whatsapp");

    await wrapper.find('[data-test="campaign-card"]').trigger("click");
    expect(wrapper.emitted("open")).toHaveLength(1);

    await menuItem(wrapper, "Editar campanha").trigger("click");
    expect(wrapper.emitted("edit")?.[0]?.[0]).toMatchObject({ id: 10 });
    expect(wrapper.emitted("open")).toHaveLength(1);

    await menuItem(wrapper, "Excluir campanha").trigger("click");
    expect(wrapper.emitted("delete")?.[0]?.[0]).toMatchObject({ id: 10 });
    expect(wrapper.emitted("open")).toHaveLength(1);

    await wrapper.find('[data-test="campaign-card"]').trigger("keydown.enter");
    expect(wrapper.emitted("open")).toHaveLength(2);
  });

  it("mantém fallbacks e remove ações exclusivas de rascunho em campanhas publicadas", () => {
    const wrapper = mountCard(campaign({ status: "running", metrics: undefined, target_audiences: [], recurrence_policy: null, last_sent_at: null }));
    expect(wrapper.text()).toContain("Sem segmento");
    expect(wrapper.text()).toContain("Uma vez");
    expect(wrapper.text()).not.toContain("Último envio");
    expect(wrapper.text()).not.toContain("Excluir campanha");
    expect(wrapper.text()).toContain("Ver configuração");
  });

  it("resume volumes grandes como no painel", () => {
    const wrapper = mountCard(campaign({ status: "running", metrics: { sends: 3100, opens: 87, clicks: 85, conversions: 0 } }));
    expect(wrapper.text()).toMatch(/3,1\smil/);
    expect(wrapper.text()).toContain("87 (2,8%)");
  });
});
