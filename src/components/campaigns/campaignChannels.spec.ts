import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import type { MarketingAsset, MarketingAssetSummary } from "@/contracts/marketingAssets";
import type { CampaignMessage, CampaignMessagePayload } from "@/contracts/campaigns";
import CampaignChannelsStep from "./CampaignChannelsStep.vue";
import MarketingAssetPreviewDialog from "@/components/marketing/MarketingAssetPreviewDialog.vue";
import {
  applyAssetToMessage,
  createChannelMessage,
  normalizeCampaignMessages,
} from "./campaignChannels";

const summaryMock = vi.hoisted(() => vi.fn());
const getAssetMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/marketingAssets", () => ({
  getMarketingAssetSummary: summaryMock,
  getMarketingAsset: getAssetMock,
  createMarketingAsset: vi.fn(),
  updateMarketingAsset: vi.fn(),
}));

const channels = ["email", "inbox", "webpush", "sms", "popup", "callcenter", "whatsapp", "rcs"] as const;
const emptySummary = Object.fromEntries(channels.map((channel) => [channel, []])) as unknown as MarketingAssetSummary;

describe("campaignChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    summaryMock.mockResolvedValue(emptySummary);
  });

  it("normaliza mensagens legadas sem perder ID ou conteúdo inline", () => {
    const messages = normalizeCampaignMessages([
      { id: 10, channel: "sms", body: "Legado", asset_id: null } as CampaignMessage,
    ], "sms");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ id: 10, channel: "sms", body: "Legado", asset_id: null });
  });

  it("copia o asset para o snapshot da mensagem", () => {
    const asset = {
      id: 3,
      project_id: 1,
      channel: "email",
      name: "Boas-vindas",
      subject: "Bem-vindo",
      body: "<p>Olá</p>",
      locale: "pt-BR",
      payload: { from_name: "BetGPT" },
      variables: { name: "Nome" },
      metadata: { origin: "test" },
      created_at: null,
      updated_at: null,
    } as MarketingAsset;
    const message = applyAssetToMessage(createChannelMessage("email"), asset);
    expect(message).toMatchObject({
      asset_id: 3,
      channel: "email",
      subject: "Bem-vindo",
      body: "<p>Olá</p>",
      locale: "pt-BR",
      variables: ["name"],
      metadata: { origin: "test", asset_payload: { from_name: "BetGPT" } },
    });
  });

  it("seleciona múltiplos canais no componente", async () => {
    const Parent = defineComponent({
      components: { CampaignChannelsStep },
      setup() {
        const messages = ref<CampaignMessagePayload[]>([]);
        return { messages };
      },
      template: '<CampaignChannelsStep v-model="messages" :project-id="1" />',
    });
    const wrapper = mount(Parent, { global: { plugins: [createPinia()] } });
    await flushPromises();

    const sms = wrapper.findAll("button").find((button) => button.text() === "SMS");
    const email = wrapper.findAll("button").find((button) => button.text() === "Email");
    expect(sms).toBeTruthy();
    expect(email).toBeTruthy();
    await sms!.trigger("click");
    await email!.trigger("click");
    await nextTick();

    expect(wrapper.vm.messages).toHaveLength(2);
    expect(wrapper.vm.messages.map((message) => message.channel)).toEqual(["sms", "email"]);
    expect(wrapper.text()).toContain("Canais");
    expect(wrapper.text()).toContain("conteúdo inline legado");
    expect(wrapper.text()).toContain("Web Push");
    expect(wrapper.text()).toContain("OnSite");
  });

  it("abre e fecha o modal com o snapshot de uma mensagem legada", async () => {
    const wrapper = mount(CampaignChannelsStep, {
      props: {
        projectId: 1,
        modelValue: [{
          id: 10,
          channel: "sms",
          asset_id: null,
          body: "Mensagem legada",
          metadata: { asset_payload: { sender: "BetGPT" } },
        }],
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();

    const previewButton = wrapper.find('button[aria-label="Pré-visualizar SMS"]');
    expect(previewButton.exists()).toBe(true);
    await previewButton.trigger("click");
    const preview = wrapper.findAllComponents(MarketingAssetPreviewDialog).at(-1)!;
    expect(preview.props("open")).toBe(true);
    expect(preview.props("asset")).toMatchObject({
      id: 10,
      channel: "sms",
      body: "Mensagem legada",
      payload: { sender: "BetGPT" },
    });
    expect(getAssetMock).not.toHaveBeenCalled();

    preview.vm.$emit("update:open", false);
    await nextTick();
    expect(preview.props("open")).toBe(false);
  });

  it("busca o conteúdo completo do asset ao pré-visualizar uma relação resumida", async () => {
    const asset = {
      id: 3,
      project_id: 1,
      channel: "sms",
      name: "Template SMS",
      subject: null,
      body: "Conteúdo do asset",
      locale: "pt-BR",
      payload: null,
      variables: null,
      metadata: null,
      created_at: null,
      updated_at: null,
    } as MarketingAsset;
    getAssetMock.mockResolvedValue(asset);
    const wrapper = mount(CampaignChannelsStep, {
      props: {
        projectId: 1,
        modelValue: [{
          id: 11,
          channel: "sms",
          asset_id: 3,
          asset: { id: 3, name: "Template SMS" },
          body: "Snapshot",
        }],
      },
      global: { plugins: [createPinia()] },
    });
    await flushPromises();

    await wrapper.find('button[aria-label="Pré-visualizar SMS"]').trigger("click");
    await flushPromises();
    expect(getAssetMock).toHaveBeenCalledWith(3);
    expect(wrapper.findAllComponents(MarketingAssetPreviewDialog).at(-1)!.props("asset")).toEqual(asset);
  });
});
