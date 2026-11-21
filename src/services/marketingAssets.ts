import api from "./base";
import { postWithIdempotency } from "./idempotency";
import type {
  MarketingAsset,
  MarketingAssetInput,
  MarketingAssetListParams,
  MarketingAssetListResponse,
  MarketingAssetSummary,
  MarketingAssetTestPayload,
  MarketingAssetTestResult,
  MarketingAssetAudioResult,
  MarketingAssetUpdateInput,
} from "@/contracts/marketingAssets";

type Envelope<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

const BASE_PATH = "/marketing/assets";

function unwrap<T>(payload: T | Envelope<T>): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as Envelope<T>).data;
  }
  return payload as T;
}

export async function listMarketingAssets(params: MarketingAssetListParams): Promise<MarketingAssetListResponse> {
  const { data } = await api.get<Envelope<MarketingAssetListResponse>>(BASE_PATH, { params });
  return unwrap(data);
}

export async function getMarketingAsset(id: number): Promise<MarketingAsset> {
  const { data } = await api.get<Envelope<MarketingAsset>>(`${BASE_PATH}/${id}`);
  return unwrap(data);
}

export async function createMarketingAsset(payload: MarketingAssetInput): Promise<MarketingAsset> {
  const data = await postWithIdempotency<Envelope<MarketingAsset>>(BASE_PATH, {
    ...payload,
    filter_id: `project_${payload.project_id}`,
  });
  return unwrap(data);
}

export async function updateMarketingAsset(id: number, payload: MarketingAssetUpdateInput): Promise<MarketingAsset> {
  const { data } = await api.put<Envelope<MarketingAsset>>(`${BASE_PATH}/${id}`, payload);
  return unwrap(data);
}

export async function deleteMarketingAsset(id: number): Promise<void> {
  await api.delete(`${BASE_PATH}/${id}`);
}

export async function getMarketingAssetSummary(projectId: number): Promise<MarketingAssetSummary> {
  const { data } = await api.get<Envelope<MarketingAssetSummary>>(`${BASE_PATH}/summary`, {
    params: { project_id: projectId },
  });
  return unwrap(data);
}

export async function uploadMarketingAssetAudio(id: number, file: File): Promise<MarketingAssetAudioResult> {
  const form = new FormData();
  form.append("audio", file);
  const { data } = await api.post<Envelope<MarketingAssetAudioResult>>(`${BASE_PATH}/${id}/audio`, form);
  return unwrap(data);
}

export async function deleteMarketingAssetAudio(id: number): Promise<MarketingAssetAudioResult> {
  const { data } = await api.delete<Envelope<MarketingAssetAudioResult>>(`${BASE_PATH}/${id}/audio`);
  return unwrap(data);
}

export async function sendMarketingAssetTest(
  asset: MarketingAsset,
  payload: MarketingAssetTestPayload,
): Promise<MarketingAssetTestResult> {
  const data = await postWithIdempotency<Envelope<MarketingAssetTestResult>>(`${BASE_PATH}/${asset.id}/test`, {
    ...payload,
    filter_id: `project_${asset.project_id}`,
  });
  return unwrap(data);
}

const marketingAssetsService = {
  listMarketingAssets,
  getMarketingAsset,
  createMarketingAsset,
  updateMarketingAsset,
  deleteMarketingAsset,
  getMarketingAssetSummary,
  uploadMarketingAssetAudio,
  deleteMarketingAssetAudio,
  sendMarketingAssetTest,
};

export default marketingAssetsService;
