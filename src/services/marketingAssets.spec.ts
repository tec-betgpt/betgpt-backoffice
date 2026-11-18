import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import type { MarketingAsset } from "@/contracts/marketingAssets";
import {
  createMarketingAsset,
  deleteMarketingAsset,
  getMarketingAssetSummary,
  listMarketingAssets,
  sendMarketingAssetTest,
  updateMarketingAsset,
} from "./marketingAssets";

vi.mock("@/services/base", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("marketingAssets service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista assets com filtros e desembrulha a resposta", async () => {
    const payload = { items: [], pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
    mocked.get.mockResolvedValue({ data: { success: true, data: payload } });
    await expect(listMarketingAssets({ project_id: 4, channel: "sms", search: "promo" })).resolves.toEqual(payload);
    expect(mocked.get).toHaveBeenCalledWith("/marketing/assets", {
      params: { project_id: 4, channel: "sms", search: "promo" },
    });
  });

  it("cria com idempotência e escopo do projeto", async () => {
    mocked.post.mockResolvedValue({ data: { success: true, data: { id: 10 } } });
    await createMarketingAsset({ project_id: 4, channel: "sms", name: "SMS", body: "Conteúdo" });
    expect(mocked.post).toHaveBeenCalledWith(
      "/marketing/assets",
      expect.objectContaining({ project_id: 4, filter_id: "project_4" }),
      expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": expect.any(String) }) }),
    );
  });

  it("atualiza e exclui pelo ID", async () => {
    mocked.put.mockResolvedValue({ data: { success: true, data: { id: 10, name: "Novo" } } });
    await updateMarketingAsset(10, { name: "Novo" });
    expect(mocked.put).toHaveBeenCalledWith("/marketing/assets/10", { name: "Novo" });
    mocked.delete.mockResolvedValue({});
    await deleteMarketingAsset(10);
    expect(mocked.delete).toHaveBeenCalledWith("/marketing/assets/10");
  });

  it("busca o summary por projeto", async () => {
    mocked.get.mockResolvedValue({ data: { success: true, data: { sms: [] } } });
    await getMarketingAssetSummary(7);
    expect(mocked.get).toHaveBeenCalledWith("/marketing/assets/summary", { params: { project_id: 7 } });
  });

  it("envia teste com escopo e destinatário", async () => {
    mocked.post.mockResolvedValue({ data: { success: true, data: { message_id: "mail-1" } } });
    const asset = { id: 10, project_id: 4, channel: "email" } as MarketingAsset;
    await sendMarketingAssetTest(asset, { recipient_email: "player@example.test" });
    expect(mocked.post).toHaveBeenCalledWith(
      "/marketing/assets/10/test",
      { recipient_email: "player@example.test", filter_id: "project_4" },
      expect.any(Object),
    );
  });
});
