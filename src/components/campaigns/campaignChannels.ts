import type { CampaignChannel, CampaignMessage, CampaignMessagePayload } from "@/contracts/campaigns";
import type { MarketingAsset } from "@/contracts/marketingAssets";

export function createChannelMessage(
  channel: CampaignChannel,
  current: Partial<CampaignMessagePayload> = {},
): CampaignMessagePayload {
  return {
    ...current,
    channel,
    asset_id: current.asset_id ?? null,
    locale: current.locale ?? "",
    subject: current.subject ?? "",
    body: current.body ?? "",
    character_count: current.character_count ?? 0,
    sms_segments_count: current.sms_segments_count ?? 0,
    detected_links: current.detected_links ?? [],
    variables: current.variables ?? [],
    metadata: current.metadata ?? null,
  };
}

export function normalizeCampaignMessages(
  messages: CampaignMessage[] | undefined,
  fallbackChannel: CampaignChannel,
): CampaignMessagePayload[] {
  return (messages ?? []).map((message) => createChannelMessage(message.channel ?? fallbackChannel, message));
}

export function applyAssetToMessage(
  current: CampaignMessagePayload,
  asset: MarketingAsset,
): CampaignMessagePayload {
  const body = asset.body;
  const currentMetadata = isRecord(current.metadata) ? current.metadata : {};
  const assetMetadata = isRecord(asset.metadata) ? asset.metadata : {};

  return createChannelMessage(asset.channel, {
    ...current,
    asset_id: asset.id,
    asset: { id: asset.id, name: asset.name },
    locale: asset.locale,
    subject: asset.subject,
    body,
    character_count: body.length,
    sms_segments_count: asset.channel === "sms" && body ? Math.ceil(body.length / 160) : 0,
    detected_links: Array.from(new Set(body.match(/https?:\/\/[^\s<>"']+/gi) ?? [])),
    variables: assetVariables(asset),
    metadata: {
      ...currentMetadata,
      ...assetMetadata,
      asset_payload: asset.payload,
    },
  });
}

function assetVariables(asset: MarketingAsset): string[] {
  if (Array.isArray(asset.variables)) return asset.variables.map(String);
  return asset.variables ? Object.keys(asset.variables) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
