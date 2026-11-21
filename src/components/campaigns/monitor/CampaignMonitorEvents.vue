<template>
  <Card>
    <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <CardTitle>{{ title }}</CardTitle>
        <CardDescription>Eventos da campanha ordenados do mais recente ao mais antigo.</CardDescription>
      </div>
      <Button variant="outline" size="sm" :disabled="loading" @click="load(pagination.current_page)">
        {{ loading ? "Atualizando..." : "Atualizar" }}
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <Alert v-if="errorMessage" variant="destructive"><AlertDescription>{{ errorMessage }}</AlertDescription></Alert>

      <div v-if="loading && !response" class="py-8 text-center text-sm text-muted-foreground">Carregando eventos...</div>
      <div v-else-if="!events.length" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum evento encontrado nesta categoria.
      </div>
      <div v-else class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="event in events" :key="`${event.source}-${event.id}`">
              <TableCell>
                <div class="flex items-center gap-2">
                  <span class="flex size-7 items-center justify-center rounded-md border" :class="CAMPAIGN_CHANNEL_COLOR_CLASSES[event.channel]">
                    <component :is="CAMPAIGN_CHANNEL_ICONS[event.channel]" class="size-3.5" />
                  </span>
                  {{ channelLabel(event.channel) }}
                </div>
              </TableCell>
              <TableCell><Badge variant="outline">{{ eventTypeLabel(event.event_type) }}</Badge></TableCell>
              <TableCell class="max-w-56 truncate" :title="event.contact || undefined">{{ event.contact || "—" }}</TableCell>
              <TableCell>{{ event.player_id || "—" }}</TableCell>
              <TableCell class="whitespace-nowrap text-xs text-muted-foreground">{{ formatDateTime(event.occurred_at) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div v-if="pagination.total" class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-xs text-muted-foreground">
          {{ pagination.total }} evento(s) · Página {{ pagination.current_page }} de {{ pagination.last_page }}
        </span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="loading || pagination.current_page <= 1" @click="load(pagination.current_page - 1)">
            Anterior
          </Button>
          <Button variant="outline" size="sm" :disabled="loading || pagination.current_page >= pagination.last_page" @click="load(pagination.current_page + 1)">
            Próxima
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignMonitorEventType, CampaignMonitorEventsResponse } from "@/contracts/campaignMonitor";
import { MARKETING_CHANNEL_LABELS, type MarketingChannel } from "@/contracts/marketingAssets";
import { getCampaignMonitorEvents } from "@/services/campaignMonitor";
import { CAMPAIGN_CHANNEL_COLOR_CLASSES, CAMPAIGN_CHANNEL_ICONS } from "../campaignPresentation";

const props = withDefaults(defineProps<{
  campaignId: number | null;
  projectId: number | null;
  type: CampaignMonitorEventType;
  title: string;
  active?: boolean;
  refreshKey?: number;
}>(), { active: false, refreshKey: 0 });

const response = ref<CampaignMonitorEventsResponse | null>(null);
const loading = ref(false);
const errorMessage = ref("");
let requestSerial = 0;
const events = computed(() => response.value?.events || []);
const pagination = computed(() => response.value?.pagination || { current_page: 1, last_page: 1, per_page: 25, total: 0 });

watch(
  [() => props.active, () => props.campaignId, () => props.projectId, () => props.type],
  ([active]) => {
    if (active && props.campaignId && props.projectId) load(1);
  },
  { immediate: true },
);

watch(
  () => props.refreshKey,
  () => {
    if (props.active && props.campaignId && props.projectId) load(pagination.value.current_page);
  },
);

async function load(page: number) {
  if (!props.campaignId || !props.projectId) return;
  const serial = ++requestSerial;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await getCampaignMonitorEvents(props.campaignId, props.projectId, props.type, page);
    if (serial === requestSerial) response.value = result;
  } catch (error) {
    if (serial === requestSerial) errorMessage.value = httpMessage(error);
  } finally {
    if (serial === requestSerial) loading.value = false;
  }
}

function channelLabel(channel: MarketingChannel) {
  return MARKETING_CHANNEL_LABELS[channel];
}

function eventTypeLabel(eventType: string) {
  if (eventType === "link.clicked") return "Clique";
  if (eventType.startsWith("conversion.")) return "Conversão";
  if (eventType.endsWith(".opened")) return "Abertura";
  if (eventType.endsWith(".bounced")) return "Bounce";
  return eventType;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function httpMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message
      || "Não foi possível carregar os eventos.";
  }
  return error instanceof Error ? error.message : "Não foi possível carregar os eventos.";
}
</script>
