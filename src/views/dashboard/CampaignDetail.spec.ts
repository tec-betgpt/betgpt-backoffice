import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import CampaignDetail from "./CampaignDetail.vue";
import type { CampaignDetail as CampaignDetailModel } from "@/contracts/campaigns";
import type { CampaignMonitorResponse } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_OPTIONS } from "@/contracts/marketingAssets";
import {
  getCampaign,
  getCampaignDispatches,
  pauseCampaign,
  resumeCampaign,
} from "@/services/campaigns";
import { getCampaignMonitor } from "@/services/campaignMonitor";
import campaignExecutionService from "@/services/campaignExecution";

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { id: "1" } }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/services/campaigns", () => ({
  getCampaign: vi.fn(),
  getCampaignDispatches: vi.fn(),
  getCampaignConversions: vi.fn(),
  pauseCampaign: vi.fn(),
  resumeCampaign: vi.fn(),
  cancelCampaign: vi.fn(),
}));
vi.mock("@/services/campaignMonitor", () => ({ getCampaignMonitor: vi.fn() }));
vi.mock("@/services/campaignExecution", () => ({
  default: {
    getRun: vi.fn(),
    getRunBatches: vi.fn(),
    getRunRecipients: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
    prepare: vi.fn(),
    launch: vi.fn(),
  },
}));

const stubs = {
  FlowSummaryPanel: { template: '<div data-test="flow-summary" />' },
  CampaignConversionsPanel: { template: "<div />" },
  CampaignCostsPanel: { template: "<div />" },
  CampaignRecipientsPanel: { template: "<div />" },
  CampaignRunProgressPanel: { template: "<div />" },
  CampaignWavesBatchesPanel: { template: "<div />" },
  CampaignMonitorOverview: { template: '<div data-test="monitor-overview" />' },
  CampaignMonitorHistory: { template: "<div />" },
  CampaignMonitorErrors: { template: "<div />" },
  CampaignMonitorEvents: { template: '<div data-test="monitor-events" />' },
  CampaignTemplatesPopover: { template: '<div data-test="templates-popover" />' },
};

function campaign(type: "broadcast" | "flow", status: "running" | "paused"): CampaignDetailModel {
  return {
    id: 1,
    project_id: 7,
    name: "Campanha monitor",
    type,
    status,
    channel: "sms",
    created_at: "2026-11-18T12:00:00Z",
    messages: [],
    schedule: null,
    single_stage_config: { target_audience_id: null },
    flow_config: type === "flow" ? { version: 1, definition: { nodes: [], edges: [] }, entry_audience: null } : null,
  } as unknown as CampaignDetailModel;
}

function monitor(): CampaignMonitorResponse {
  const channels = Object.fromEntries(MARKETING_CHANNEL_OPTIONS.map(({ value }) => [value, {
    channel: value,
    sends: value === "sms" ? 10 : 0,
    deliveries: value === "sms" ? 8 : 0,
    opens: 0,
    clicks: 0,
    conversions: 0,
    bounces: 0,
    errors: 0,
    opt_outs: 0,
  }]));
  return {
    campaign_id: 1,
    campaign_status: "running",
    run: { id: 1, status: "running", started_at: null, finished_at: null, last_error: null, counts: { total_recipients: 100, pending: 0, processing: 0, sent: 10, failed: 0, canceled: 0 } },
    waves: [],
    events: {},
    forecast: { total_recipients: 100, sent: 10, failed: 0, pending: 90, completed_percent: 10, rate_per_minute: 1, eta_seconds: null, estimate_complete_at: null },
    channels: channels as CampaignMonitorResponse["channels"],
    channel_totals: { sends: 10, deliveries: 8, opens: 2, clicks: 3, conversions: 2, bounces: 0, errors: 0, opt_outs: 1 },
    history: [],
    errors: [],
  };
}

function run(status: "running" | "paused") {
  return {
    id: 1,
    campaign_id: 1,
    status,
    total_recipients: 100,
    counts: { total_recipients: 100, pending: 0, processing: 0, sent: 10, failed: 0, canceled: 0 },
    prepared_at: null,
    started_at: null,
    paused_at: null,
    resumed_at: null,
    canceled_at: null,
    finished_at: null,
    last_error: null,
    metadata: null,
    created_at: "2026-11-18T12:00:00Z",
    updated_at: "2026-11-18T12:00:00Z",
  };
}

async function mountDetail(type: "broadcast" | "flow", status: "running" | "paused") {
  vi.mocked(getCampaign).mockResolvedValue(campaign(type, status));
  vi.mocked(getCampaignDispatches).mockResolvedValue({ status, dispatches: [] } as any);
  vi.mocked(getCampaignMonitor).mockResolvedValue(monitor());
  vi.mocked(campaignExecutionService.getRun).mockResolvedValue({ run: run(status), waves: [] } as any);
  const wrapper = mount(CampaignDetail, { global: { plugins: [createPinia()], stubs } });
  await flushPromises();
  return wrapper;
}

describe("CampaignDetail monitor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renderiza monitor single-stage e executa pause", async () => {
    vi.mocked(pauseCampaign).mockResolvedValue({} as any);
    const wrapper = await mountDetail("broadcast", "running");
    expect(wrapper.text()).toContain("Visão Geral");
    expect(wrapper.text()).toContain("Histórico");
    expect(wrapper.text()).toContain("Envios");
    expect(wrapper.text()).toContain("Aberturas");
    expect(wrapper.text()).toContain("Cliques");
    expect(wrapper.text()).toContain("Conversões");
    expect(wrapper.text()).toContain("Bounces");
    expect(wrapper.text()).toContain("Custos");
    expect(wrapper.text()).toContain("Erros");
    expect(wrapper.find('[data-test="templates-popover"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Abrir configuração da campanha"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="monitor-overview"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="flow-summary"]').exists()).toBe(false);

    const pause = wrapper.findAll("button").find((button) => button.text() === "Pausar");
    await pause!.trigger("click");
    await flushPromises();
    expect(pauseCampaign).toHaveBeenCalledWith(1);
    wrapper.unmount();
  });

  it("renderiza fluxo e executa resume", async () => {
    vi.mocked(resumeCampaign).mockResolvedValue({} as any);
    const wrapper = await mountDetail("flow", "paused");
    expect(wrapper.find('[data-test="flow-summary"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Multi-estágio");

    const resume = wrapper.findAll("button").find((button) => button.text() === "Retomar");
    await resume!.trigger("click");
    await flushPromises();
    expect(resumeCampaign).toHaveBeenCalledWith(1);
    wrapper.unmount();
  });
});
