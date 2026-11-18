<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Pencil } from "lucide-vue-next";
import linksService from "@/services/links";
import EditDialogComponent from "@/components/links/EditDialogComponent.vue";
import LinkStatusIndicator from "@/components/links/LinkStatusIndicator.vue";
import LinkTrackingBadge from "@/components/links/LinkTrackingBadge.vue";
import { formatClickCount, getLinkClickMetrics } from "@/components/links/linkClicks";
import {
  getActiveVersion,
  getDestinationUrl,
  getVersionNumber,
} from "@/components/links/linkForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LinkDetailsResponse } from "@/contracts/link";

const props = defineProps<{
  open: boolean;
  linkId: number | null;
  refreshList?: (page?: number) => Promise<void> | void;
}>();

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
}>();

const isLoading = ref(false);
const isEditOpen = ref(false);
const details = ref<LinkDetailsResponse | null>(null);

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const lastVersion = computed(() =>
  details.value ? getActiveVersion(details.value) : null,
);

const lastVersionDestinations = computed(() => {
  const version = lastVersion.value;
  if (!version) return [];
  if (version.destinations?.length) return version.destinations;
  return version.destination ? [version.destination] : [];
});

const snapshots = computed(() => [
  ...(details.value?.utmSnapshots ?? []),
  ...(details.value?.utm_snapshots ?? []),
]);

const clickMetrics = computed(() =>
  details.value
    ? getLinkClickMetrics(details.value)
    : { total: null, last24h: null },
);

async function loadDetails() {
  if (!props.linkId) {
    details.value = null;
    return;
  }

  isLoading.value = true;

  try {
    details.value = await linksService.show(props.linkId);
  } catch (error) {
    console.error("Erro ao carregar detalhes do link:", error);
    details.value = null;
    isOpen.value = false;
  } finally {
    isLoading.value = false;
  }
}

async function refreshAfterEdit() {
  await loadDetails();
  await props.refreshList?.();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

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

watch(
  () => [props.open, props.linkId] as const,
  ([open]) => {
    if (open) {
      loadDetails();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="right" class="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <SheetTitle>Detalhes do link</SheetTitle>
            <SheetDescription>
              Histórico de versões, destino atual, cliques e snapshots de UTM.
            </SheetDescription>
          </div>

          <Button
            v-if="linkId"
            variant="outline"
            size="sm"
            class="gap-2"
            @click="isEditOpen = true"
          >
            <Pencil class="h-4 w-4" />
            Editar
          </Button>
        </div>
      </SheetHeader>

      <div v-if="isLoading" class="py-8 text-center text-muted-foreground">
        Carregando detalhes...
      </div>

      <div v-else-if="details" class="mt-6 space-y-6">
        <Card>
          <CardContent class="space-y-3 pt-6">
            <div class="flex items-center justify-between gap-3">
              <span class="font-mono text-lg font-semibold">{{ details.code }}</span>
              <LinkStatusIndicator :status="details.status" />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <p class="text-xs text-muted-foreground">Total de cliques</p>
                <p class="text-lg font-semibold">{{ formatClickCount(clickMetrics.total) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Cliques 24h</p>
                <p class="text-lg font-semibold">{{ formatClickCount(clickMetrics.last24h) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Último clique</p>
                <p class="text-sm">{{ formatDateTime(details.last_click_at) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Trackeamento</p>
                <LinkTrackingBadge :tracking="details.tracking" />
              </div>
            </div>

            <div class="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
              <div><span class="font-medium">Slug:</span> {{ details.slug || "—" }}</div>
              <div><span class="font-medium">Tipo:</span> {{ details.type || "—" }}</div>
              <div class="sm:col-span-2">
                <span class="font-medium">Destino atual:</span>
                {{ getDestinationUrl(details) }}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Última versão</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <template v-if="lastVersion">
              <div class="space-y-2 rounded-lg border p-4">
                <div class="flex items-center justify-between gap-3">
                  <Badge variant="outline">
                    Versão {{ getVersionNumber(lastVersion) ?? "—" }}
                  </Badge>
                  <span class="text-xs text-muted-foreground">
                    {{ lastVersion.created_at || "Sem data" }}
                  </span>
                </div>
                <div
                  v-for="dest in lastVersionDestinations"
                  :key="dest.id ?? dest.url"
                  class="mt-2 space-y-1 border-t pt-2 first:mt-0 first:border-t-0 first:pt-0"
                >
                  <div class="text-sm"><span class="font-medium">URL:</span> {{ dest.url || "—" }}</div>
                  <div class="text-sm"><span class="font-medium">Peso:</span> {{ dest.weight ?? "—" }}</div>
                  <div class="text-sm"><span class="font-medium">Status:</span> {{ dest.status || "—" }}</div>
                </div>
              </div>
            </template>
            <div v-else class="text-sm text-muted-foreground">
              Nenhuma versão retornada.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>UTM Snapshots</CardTitle></CardHeader>
          <CardContent class="space-y-3">
            <div v-if="snapshots.length === 0" class="text-sm text-muted-foreground">
              Nenhum snapshot retornado.
            </div>
            <div
              v-for="snapshot in snapshots"
              :key="snapshot.id || snapshot.snapshot_at || JSON.stringify(snapshot)"
              class="space-y-1 rounded-lg border p-4"
            >
              <div class="text-sm"><span class="font-medium">UTM Source:</span> {{ snapshot.utm_source || "—" }}</div>
              <div class="text-sm"><span class="font-medium">UTM Medium:</span> {{ snapshot.utm_medium || "—" }}</div>
              <div class="text-sm"><span class="font-medium">UTM Campaign:</span> {{ snapshot.utm_campaign || "—" }}</div>
              <div class="text-sm"><span class="font-medium">UTM Content:</span> {{ snapshot.utm_content || "—" }}</div>
              <div class="text-sm"><span class="font-medium">UTM Term:</span> {{ snapshot.utm_term || "—" }}</div>
              <div v-if="snapshot.context" class="border-t pt-1 text-sm">
                <span class="font-medium">Channel:</span> {{ snapshot.context.channel || "—" }}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  </Sheet>

  <EditDialogComponent
    v-model:open="isEditOpen"
    :link-id="linkId"
    :current-page="1"
    :refresh-list="refreshAfterEdit"
  />
</template>
