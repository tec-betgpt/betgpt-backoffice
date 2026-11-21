import { describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import CampaignTemplatesPopover from "./CampaignTemplatesPopover.vue";
import MarketingAssetPreviewDialog from "@/components/marketing/MarketingAssetPreviewDialog.vue";
import { Popover } from "@/components/ui/popover";
import type { MarketingAsset } from "@/contracts/marketingAssets";

const template: MarketingAsset = {
  id: 3,
  project_id: 1,
  channel: "sms",
  name: "Template da campanha",
  subject: null,
  body: "Conteúdo do template",
  locale: "pt-BR",
  payload: null,
  variables: null,
  metadata: null,
  created_at: null,
  updated_at: null,
};

describe("CampaignTemplatesPopover", () => {
  it("abre a lista no hover e usa o preview compartilhado", async () => {
    const wrapper = mount(CampaignTemplatesPopover, {
      props: { templates: [template] },
      global: {
        stubs: {
          Popover: { name: "Popover", props: ["open"], template: "<div><slot /></div>" },
          PopoverTrigger: { template: "<div><slot /></div>" },
          PopoverContent: { template: "<div><slot /></div>" },
        },
      },
    });

    await wrapper.find("[data-campaign-templates]").trigger("mouseenter");
    expect(wrapper.findComponent(Popover).props("open")).toBe(true);

    const previewButton = wrapper.findAll("button")
      .find((button) => button.text().includes("Pré-visualizar Template da campanha"));
    expect(previewButton).toBeTruthy();
    await previewButton!.trigger("click");
    await flushPromises();

    const preview = wrapper.findComponent(MarketingAssetPreviewDialog);
    expect(preview.props("open")).toBe(true);
    expect(preview.props("asset")).toEqual(template);
    preview.vm.$emit("update:open", false);
    await flushPromises();
    expect(preview.props("open")).toBe(false);
  });
});
