<template>
  <div class="space-y-4">
    <div v-if="store.loading && store.events.length === 0" class="space-y-3">
      <Skeleton v-for="item in 4" :key="item" class="h-14 w-full" />
    </div>

    <Alert v-else-if="store.error && store.events.length === 0" variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <AlertTitle>Não foi possível carregar a timeline</AlertTitle>
      <AlertDescription class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span>{{ store.error }}</span>
        <Button variant="outline" size="sm" :disabled="store.loading" @click="load(false)">
          Tentar novamente
        </Button>
      </AlertDescription>
    </Alert>

    <div v-else-if="store.events.length === 0" class="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Clock class="h-8 w-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Nenhum evento registrado para este contato.</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="group in groupedEvents" :key="group.date" class="space-y-2">
        <div class="flex items-center gap-2">
          <CalendarDays class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-semibold">{{ group.label }}</span>
          <Separator class="flex-1" />
        </div>

        <div class="relative space-y-1 pl-5">
          <div class="absolute bottom-2 left-[9px] top-2 w-px bg-border" />
          <div
            v-for="event in group.items"
            :key="event.event_id"
            class="relative flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
          >
            <div
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
              :class="iconMeta(event.event_type).class"
            >
              <component :is="iconMeta(event.event_type).icon" class="h-4 w-4" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span class="text-sm font-medium">{{ labelFor(event.event_type) }}</span>
                <Badge :variant="badgeVariantFor(event.event_type)">
                  {{ event.event_type }}
                </Badge>
                <span
                  v-if="campaignRef(event)"
                  class="text-xs text-muted-foreground"
                  title="Campanha"
                >
                  {{ campaignRef(event) }}
                </span>
              </div>

              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span class="inline-flex items-center gap-1">
                  <Clock3 class="h-3 w-3" />
                  {{ formatDateTime(event.occurred_at) }}
                </span>
                <span v-if="statusLabel(event)" class="inline-flex items-center gap-1">
                  <CircleDot class="h-3 w-3" />
                  {{ statusLabel(event) }}
                </span>
                <span v-if="event.subject_id" class="inline-flex items-center gap-1">
                  <Hash class="h-3 w-3" />
                  recipient #{{ event.subject_id }}
                </span>
              </div>

              <pre
                v-if="event.data && Object.keys(event.data).length"
                class="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed"
                >{{ JSON.stringify(event.data, null, 2) }}</pre
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center pt-1">
        <Button
          v-if="store.hasMore"
          variant="outline"
          size="sm"
          :disabled="store.loading"
          @click="load(true)"
        >
          <Loader2 v-if="store.loading" class="mr-2 h-4 w-4 animate-spin" />
          Carregar mais
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  AlertCircle,
  CalendarDays,
  CheckCheck,
  CircleDot,
  Clock,
  Clock3,
  Flag,
  Hash,
  Loader2,
  MousePointerClick,
  Play,
  Send,
  TrendingUp,
  UserX,
  AlertTriangle,
} from "lucide-vue-next";
import { useTimelineStore } from "@/stores/timeline";
import {
  EVENT_TYPE_LABELS,
  isEventType,
  type CanonicalEvent,
  type EventType,
} from "@/contracts/observability";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelineGroup {
  date: string;
  label: string;
  items: CanonicalEvent[];
}

const props = defineProps<{
  contact: string;
  projectId: number;
  limit?: number;
}>();

const store = useTimelineStore();

const pageSize = computed(() => props.limit ?? 50);

const groupedEvents = computed<TimelineGroup[]>(() => {
  const groups = new Map<string, CanonicalEvent[]>();

  store.events.forEach((event) => {
    const date = new Date(event.occurred_at);
    const key = date.toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(event);
  });

  return Array.from(groups.entries()).map(([key, items]) => ({
    date: key,
    label: formatDayLabel(new Date(key)),
    items,
  }));
});

function load(append: boolean) {
  return store.fetchContactTimeline(
    props.projectId,
    props.contact,
    {
      since: append ? store.currentSince ?? undefined : undefined,
      limit: pageSize.value,
    },
    append,
  );
}

function labelFor(eventType: string) {
  if (isEventType(eventType)) return EVENT_TYPE_LABELS[eventType];
  return humanizeEventType(eventType);
}

function humanizeEventType(value: string) {
  return value.replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeVariantFor(eventType: string) {
  if (eventType === "sms.failed" || eventType === "campaign.exited") return "destructive";
  if (eventType === "contact.opted_out" || eventType === "conversion.created") return "secondary";
  return "outline";
}

function campaignRef(event: CanonicalEvent) {
  const ref = event.references_data?.campaign_id;
  return ref ? `Campanha ${ref}` : null;
}

function statusLabel(event: CanonicalEvent) {
  const status = event.data?.status;
  return typeof status === "string" ? status : null;
}

function iconMeta(eventType: string) {
  if (!isEventType(eventType)) {
    return { icon: AlertCircle, class: "bg-muted text-muted-foreground border-border" };
  }

  const meta: Record<EventType, { icon: typeof AlertCircle; class: string }> = {
    "campaign.entered": { icon: Play, class: "bg-blue-500/10 text-blue-600 border-blue-200" },
    "campaign.exited": { icon: Flag, class: "bg-slate-500/10 text-slate-500 border-slate-200" },
    "sms.queued": { icon: Clock3, class: "bg-amber-500/10 text-amber-600 border-amber-200" },
    "sms.sent": { icon: Send, class: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
    "sms.delivered": { icon: CheckCheck, class: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
    "sms.failed": { icon: AlertCircle, class: "bg-red-500/10 text-red-600 border-red-200" },
    "link.clicked": { icon: MousePointerClick, class: "bg-purple-500/10 text-purple-600 border-purple-200" },
    "conversion.created": { icon: TrendingUp, class: "bg-teal-500/10 text-teal-600 border-teal-200" },
    "contact.opted_out": { icon: UserX, class: "bg-orange-500/10 text-orange-600 border-orange-200" },
  };

  return meta[eventType];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dayKey = date.toDateString();
  if (dayKey === today.toDateString()) return "Hoje";
  if (dayKey === yesterday.toDateString()) return "Ontem";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
</script>
