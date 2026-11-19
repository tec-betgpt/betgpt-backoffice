import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import FlowEditorCanvas from "./FlowEditorCanvas.vue";

vi.mock("@vue-flow/core", () => ({
  VueFlow: { template: "<div><slot /></div>" },
  useVueFlow: () => ({
    addEdges: vi.fn(),
    addNodes: vi.fn(),
    screenToFlowCoordinate: vi.fn((point) => point),
    setViewport: vi.fn(),
    fitView: vi.fn(),
  }),
  MarkerType: { ArrowClosed: "arrowclosed" },
}));

vi.mock("@/stores/workspace", () => ({
  useWorkspaceStore: () => ({ numericProjectId: null }),
}));
vi.mock("@/services/marketingAssets", () => ({
  getMarketingAssetSummary: vi.fn(),
}));

const stubs = {
  VueFlow: { template: "<div><slot /></div>" },
  Background: true,
  Controls: true,
  MiniMap: true,
  FlowTriggerNode: true,
  FlowConditionNode: true,
  FlowActionNode: true,
  FlowNodeCatalogPanel: { template: "<div />" },
  Popover: {
    props: { open: Boolean },
    template: '<div data-test="catalog" :data-open="String(open)"><slot /></div>',
  },
  PopoverTrigger: { template: "<div><slot /></div>" },
  PopoverContent: { template: "<div><slot /></div>" },
  FlowTemplatesGallery: {
    props: { open: Boolean },
    template: '<div data-test="gallery" :data-open="String(open)" />',
  },
};

function config(nodes: any[] = []) {
  return {
    version: 1,
    definition: { nodes, edges: [], viewport: null },
    entry_audience: null,
  };
}

async function mountCanvas(nodes: any[] = []) {
  const wrapper = mount(FlowEditorCanvas, {
    props: { modelValue: config(nodes), catalog: [], templates: [] },
    global: { stubs },
  });
  await flushPromises();
  return wrapper;
}

describe("FlowEditorCanvas catalog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("não abre diálogos em um fluxo existente", async () => {
    const wrapper = await mountCanvas([{
      id: "node-1",
      type: "campaign_started",
      position: { x: 0, y: 0 },
      config: {},
    }]);
    expect(wrapper.get('[data-test="catalog"]').attributes("data-open")).toBe("false");
    expect(wrapper.get('[data-test="gallery"]').attributes("data-open")).toBe("false");
  });

  it("não abre diálogos em um fluxo vazio", async () => {
    const wrapper = await mountCanvas();
    expect(wrapper.get('[data-test="catalog"]').attributes("data-open")).toBe("false");
    expect(wrapper.get('[data-test="gallery"]').attributes("data-open")).toBe("false");
  });

  it("abre o catálogo somente por ação do usuário", async () => {
    const wrapper = await mountCanvas();
    await (wrapper.findComponent('[data-test="catalog"]') as VueWrapper).vm.$emit("update:open", true);
    await nextTick();
    expect(wrapper.get('[data-test="catalog"]').attributes("data-open")).toBe("true");
  });

  it("aplicar template não reabre diálogos automaticamente", async () => {
    const wrapper = await mountCanvas();
    await (wrapper.findComponent('[data-test="gallery"]') as VueWrapper).vm.$emit("select-template", {
      name: "Template",
      definition: { nodes: [], edges: [], viewport: null },
    });
    await nextTick();
    expect(wrapper.get('[data-test="catalog"]').attributes("data-open")).toBe("false");
    expect(wrapper.get('[data-test="gallery"]').attributes("data-open")).toBe("false");
  });
});
