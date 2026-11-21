import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import MarketingAssetPreviewDialog from "./MarketingAssetPreviewDialog.vue";
import type { MarketingAsset } from "@/contracts/marketingAssets";

function asset(overrides: Partial<MarketingAsset>): MarketingAsset {
  return {
    id: 1,
    project_id: 1,
    channel: "email",
    name: "Template",
    subject: null,
    body: "",
    locale: null,
    payload: null,
    variables: null,
    metadata: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe("MarketingAssetPreviewDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renderiza HTML em iframe sandboxed", async () => {
    mount(MarketingAssetPreviewDialog, {
      props: { open: true, asset: asset({ body: "<p>Olá</p>" }) },
      attachTo: document.body,
    });
    await flushPromises();
    const iframe = document.body.querySelector("iframe");
    expect(iframe?.getAttribute("sandbox")).toBe("");
    expect(iframe?.getAttribute("srcdoc")).toContain("Olá");
  });

  it("renderiza áudio do Callcenter", async () => {
    mount(MarketingAssetPreviewDialog, {
      props: {
        open: true,
        asset: asset({ channel: "callcenter", audio_url: "https://example.test/voice.mp3" }),
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.querySelector("audio")?.getAttribute("src")).toBe("https://example.test/voice.mp3");
  });

  it("renderiza botões do PopUp", async () => {
    mount(MarketingAssetPreviewDialog, {
      props: {
        open: true,
        asset: asset({ channel: "popup", payload: { buttons: [{ label: "Aproveitar", action_url: "https://example.test" }] } }),
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.textContent).toContain("Aproveitar");
  });
});
