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
import type { CampaignChannel } from "@/contracts/campaigns";

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
