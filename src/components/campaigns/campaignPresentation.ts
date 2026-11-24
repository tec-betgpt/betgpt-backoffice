import type { Component } from "vue";
import {
  Bell,
  Inbox,
  Mail,
  MessageCircle,
  MessageSquareText,
  Mic,
  PanelsTopLeft,
  Radio,
} from "lucide-vue-next";
import type { CampaignChannel, CampaignStatus } from "@/contracts/campaigns";

export const CAMPAIGN_CHANNEL_ICONS: Record<CampaignChannel, Component> = {
  email: Mail,
  inbox: Inbox,
  webpush: Bell,
  sms: MessageSquareText,
  popup: PanelsTopLeft,
  callcenter: Mic,
  whatsapp: MessageCircle,
  rcs: Radio,
};

export const CAMPAIGN_CHANNEL_COLOR_CLASSES: Record<CampaignChannel, string> = {
  email: "border-blue-200 bg-blue-50 text-blue-600",
  inbox: "border-violet-200 bg-violet-50 text-violet-600",
  webpush: "border-amber-200 bg-amber-50 text-amber-600",
  sms: "border-emerald-200 bg-emerald-50 text-emerald-600",
  popup: "border-cyan-200 bg-cyan-50 text-cyan-600",
  callcenter: "border-rose-200 bg-rose-50 text-rose-600",
  whatsapp: "border-green-200 bg-green-50 text-green-600",
  rcs: "border-indigo-200 bg-indigo-50 text-indigo-600",
};

export const CAMPAIGN_CHANNEL_TEXT_CLASSES: Record<CampaignChannel, string> = {
  email: "text-blue-500",
  inbox: "text-violet-500",
  webpush: "text-amber-500",
  sms: "text-emerald-500",
  popup: "text-cyan-500",
  callcenter: "text-rose-500",
  whatsapp: "text-green-500",
  rcs: "text-indigo-500",
};

export const CAMPAIGN_STATUS_BADGE_CLASSES: Record<CampaignStatus, string> = {
  draft: "border-amber-500/60 bg-amber-500/10 text-amber-500",
  validating: "border-sky-500/60 bg-sky-500/10 text-sky-500",
  validation_failed: "border-red-500/60 bg-red-500/10 text-red-500",
  validated: "border-sky-500/60 bg-sky-500/10 text-sky-500",
  prepared: "border-sky-500/60 bg-sky-500/10 text-sky-500",
  running: "border-emerald-500/60 bg-emerald-500/10 text-emerald-500",
  paused: "border-yellow-500/60 bg-yellow-500/10 text-yellow-500",
  completed: "border-blue-500/60 bg-blue-500/10 text-blue-500",
  canceled: "border-red-500/60 bg-red-500/10 text-red-500",
  archived: "border-border bg-muted/40 text-muted-foreground",
};

export function formatCampaignNumber(value: number | null | undefined, compactFrom = 1000): string {
  const number = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    notation: Math.abs(number) >= compactFrom ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(number);
}

export function formatCampaignRate(part: number | null | undefined, total: number | null | undefined): string {
  const base = Number(total ?? 0);
  const rate = base > 0 ? (Number(part ?? 0) / base) * 100 : 0;
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(rate)}%`;
}

export function formatRelativeTime(value: string | null | undefined, now = new Date()): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return "agora";
}
