import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { ref } from "vue";
import FlowActionNode from "./FlowActionNode.vue";
import type { MarketingAsset, MarketingAssetSummary } from "@/contracts/marketingAssets";
import { getMarketingAsset } from "@/services/marketingAssets";

const updateNodeData = vi.hoisted(() => vi.fn());

vi.mock("@vue-flow/core", () => ({
  Handle: { template: "<span />" },
  Position: { Top: "top", Bottom: "bottom" },
  useVueFlow: () => ({ updateNodeData }),
}));

vi.mock("@/services/marketingAssets", () => ({
  getMarketingAsset: vi.fn(),
}));

const asset = {
  id: 7,
  project_id: 1,
  channel: "email",
  name: "Boas-vindas",
  subject: "Bem-vindo",
  body: "<p>Olá</p>",
  locale: "pt-BR",
  payload: null,
  variables: null,
  metadata: null,
  created_at: null,
  updated_at: null,
} as MarketingAsset;
const summary = Object.assign({}, ...["email", "inbox", "webpush", "sms", "popup", "callcenter", "whatsapp", "rcs"].map((channel) => ({ [channel]: [] })), {
  email: [{ id: 7, name: "Boas-vindas", channel: "email", createdAt: null }],
}) as MarketingAssetSummary;

describe("FlowActionNode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("seleciona template do menu sem editar conteúdo inline", async () => {
    vi.mocked(getMarketingAsset).mockResolvedValue(asset);
    const wrapper = mount(FlowActionNode, {
      props: {
        id: "email-1",
        selected: false,
        data: {
          nodeType: "send_email",
          label: "Enviar e-mail",
          description: "Envia um e-mail",
          category: "action",
          config: { message: "Legado" },
        },
      } as any,
      global: { provide: { flowAssets: ref(summary) } },
    });

    expect(wrapper.find("textarea").exists()).toBe(false);
    expect(wrapper.text()).toContain("Template de E-mail");
    expect(wrapper.text()).toContain("Conteúdo inline legado");

    const select = wrapper.find("select");
    (select.element as HTMLSelectElement).value = "7";
    await select.trigger("change");
    await flushPromises();

    expect(updateNodeData).toHaveBeenCalledWith("email-1", {
      config: expect.objectContaining({ asset_id: 7 }),
    });
    expect(getMarketingAsset).toHaveBeenCalledWith(7);
    expect(wrapper.text()).toContain("Bem-vindo");
  });
});
