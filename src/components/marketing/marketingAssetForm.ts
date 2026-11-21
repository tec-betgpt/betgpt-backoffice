import type { MarketingAsset, MarketingAssetInput, MarketingChannel } from "@/contracts/marketingAssets";

export interface MarketingAssetFormState {
  name: string;
  subject: string;
  body: string;
  locale: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
  sender: string;
  title: string;
  icon: string;
  actionUrl: string;
  callerId: string;
  voice: string;
  mediaType: string;
  mediaUrl: string;
  variables: string;
  metadata: string;
  whatsappCategory: string;
  placeholders: string;
  popupButtons: Array<{ label: string; actionUrl: string }>;
  audioPreviewUrl: string;
  audioName: string;
}

export function createEmptyAssetForm(): MarketingAssetFormState {
  return {
    name: "",
    subject: "",
    body: "",
    locale: "pt-BR",
    fromAddress: "",
    fromName: "",
    replyTo: "",
    sender: "",
    title: "",
    icon: "",
    actionUrl: "",
    callerId: "",
    voice: "",
    mediaType: "",
    mediaUrl: "",
    variables: "",
    metadata: "",
    whatsappCategory: "",
    placeholders: "",
    popupButtons: [],
    audioPreviewUrl: "",
    audioName: "",
  };
}

export function fillAssetForm(asset: MarketingAsset): MarketingAssetFormState {
  const payload = (asset.payload ?? {}) as Record<string, any>;
  const media = (payload.media ?? {}) as Record<string, any>;

  return {
    ...createEmptyAssetForm(),
    name: asset.name,
    subject: asset.subject ?? "",
    body: asset.body,
    locale: asset.locale ?? "",
    fromAddress: stringValue(payload.from_address),
    fromName: stringValue(payload.from_name),
    replyTo: stringValue(payload.reply_to),
    sender: stringValue(payload.sender),
    title: stringValue(payload.title),
    icon: stringValue(payload.icon),
    actionUrl: stringValue(payload.action_url),
    callerId: stringValue(payload.caller_id),
    voice: stringValue(payload.voice),
    mediaType: stringValue(media.type),
    mediaUrl: stringValue(media.url),
    variables: jsonValue(asset.variables),
    metadata: jsonValue(asset.metadata),
    whatsappCategory: stringValue(payload.category),
    placeholders: Array.isArray(payload.placeholders) ? payload.placeholders.join(", ") : "",
    popupButtons: Array.isArray(payload.buttons) ? payload.buttons.map((button: any) => ({
      label: stringValue(button.label),
      actionUrl: stringValue(button.action_url),
    })) : [],
    audioPreviewUrl: asset.audio_url || stringValue(payload.audio?.url),
    audioName: "",
  };
}

export function validateAssetForm(form: MarketingAssetFormState, channel: MarketingChannel): string | null {
  if (!form.name.trim()) return "Informe o nome do template.";
  if (channel !== "callcenter" && !form.body.trim()) return "Informe o conteúdo do template.";
  if (channel === "email" && !form.subject.trim()) return "Informe o assunto do e-mail.";
  if (channel === "sms" && form.body.length > 1530) return "A mensagem excede o limite de 1530 caracteres do SMS.";
  if (channel === "webpush" && !form.title.trim()) return "Informe o título do Webpush.";
  if (channel === "whatsapp" && !form.whatsappCategory) return "Selecione a categoria do template WhatsApp.";
  if (channel === "popup" && form.popupButtons.some((button) => Boolean(button.label.trim()) !== Boolean(button.actionUrl.trim()))) {
    return "Preencha o rótulo e a ação de cada botão do PopUp.";
  }
  if (channel === "callcenter" && !form.audioPreviewUrl) return "Selecione um arquivo de áudio.";
  if (["whatsapp", "rcs"].includes(channel) && Boolean(form.mediaType) !== Boolean(form.mediaUrl.trim())) {
    return "Informe o tipo e a URL da mídia, ou deixe ambos vazios.";
  }

  try {
    buildAssetPayload(form, channel, 1);
  } catch (error) {
    return error instanceof Error ? error.message : "Revise os campos JSON.";
  }

  return null;
}

export function buildAssetPayload(
  form: MarketingAssetFormState,
  channel: MarketingChannel,
  projectId: number,
): MarketingAssetInput {
  return {
    project_id: projectId,
    channel,
    name: form.name.trim(),
    subject: form.subject.trim() || null,
    body: form.body,
    locale: form.locale.trim() || null,
    payload: channelPayload(form, channel),
    variables: parseJson(form.variables, "Variáveis"),
    metadata: parseJson(form.metadata, "Metadados"),
  };
}

function channelPayload(form: MarketingAssetFormState, channel: MarketingChannel): Record<string, unknown> | null {
  const payload: Record<string, unknown> = {};
  const put = (key: string, value: string) => {
    if (value.trim()) payload[key] = value.trim();
  };

  if (channel === "email") {
    put("from_address", form.fromAddress);
    put("from_name", form.fromName);
    put("reply_to", form.replyTo);
  } else if (channel === "sms") {
    put("sender", form.sender);
  } else if (channel === "webpush") {
    put("title", form.title);
    put("icon", form.icon);
    put("action_url", form.actionUrl);
  } else if (["inbox", "popup"].includes(channel)) {
    put("title", form.title);
    put("action_url", form.actionUrl);
  } else if (channel === "callcenter") {
    put("caller_id", form.callerId);
    put("voice", form.voice);
  } else if (["whatsapp", "rcs"].includes(channel) && form.mediaType && form.mediaUrl.trim()) {
    payload.media = { type: form.mediaType, url: form.mediaUrl.trim() };
  }

  if (channel === "whatsapp") {
    put("category", form.whatsappCategory);
    const placeholders = form.placeholders.split(",").map((item) => item.trim()).filter(Boolean);
    if (placeholders.length) payload.placeholders = placeholders;
  }

  if (channel === "popup") {
    const buttons = form.popupButtons
      .filter((button) => button.label.trim() && button.actionUrl.trim())
      .map((button) => ({ label: button.label.trim(), action_url: button.actionUrl.trim() }));
    if (buttons.length) payload.buttons = buttons;
  }

  return Object.keys(payload).length ? payload : null;
}

function parseJson(value: string, label: string): Record<string, unknown> | unknown[] | null {
  if (!value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") throw new Error();
    return parsed;
  } catch {
    throw new Error(`${label} deve conter um objeto ou array JSON válido.`);
  }
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function jsonValue(value: unknown): string {
  return value ? JSON.stringify(value, null, 2) : "";
}
