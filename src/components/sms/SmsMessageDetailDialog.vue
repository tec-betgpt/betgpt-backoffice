<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Detalhe da mensagem</DialogTitle>
        <DialogDescription>
          Estado consolidado, timeline de eventos e payloads brutos do envio.
        </DialogDescription>
      </DialogHeader>

      <div v-if="store.loadingDetail" class="space-y-3">
        <Skeleton class="h-6 w-full" />
        <Skeleton class="h-6 w-full" />
        <Skeleton class="h-6 w-full" />
      </div>

      <Alert v-else-if="store.detailError" variant="destructive">
        <AlertTitle>Não foi possível carregar o detalhe</AlertTitle>
        <AlertDescription>{{ store.detailError }}</AlertDescription>
      </Alert>

      <template v-else-if="store.detail">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <SmsStatusBadge :status="store.detail.status" />
            <span class="text-xs text-muted-foreground font-mono">{{ store.detail.uuid }}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="!store.canSync || store.syncing"
            :title="
              store.canSync
                ? 'Consultar status atual no supplier'
                : 'Mensagem sem identificador externo — nunca chegou ao supplier'
            "
            @click="sync"
          >
            <LucideSpinner v-if="store.syncing" class="mr-2 h-4 w-4 animate-spin" />
            <RefreshCw v-else class="mr-2 h-4 w-4" />
            Consultar status
          </Button>
        </div>

        <Alert v-if="syncFeedback" :variant="syncFeedback.variant">
          <AlertDescription>{{ syncFeedback.message }}</AlertDescription>
        </Alert>

        <Tabs default-value="summary" class="w-full">
          <TabsList>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="payload">Payload</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" class="space-y-4 pt-2">
            <div class="grid gap-3 md:grid-cols-3">
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">Destinatário</div>
                <div class="font-mono text-sm">{{ store.detail.recipient_phone_e164 || store.detail.recipient_phone || "—" }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">Status no supplier</div>
                <div class="font-mono text-sm">{{ store.detail.supplier_status || "—" }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">Segmentos / caracteres</div>
                <div class="font-mono text-sm">
                  {{ store.detail.sms_segments ?? "—" }} / {{ store.detail.character_count ?? "—" }}
                </div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">supplier_message_id</div>
                <div class="break-all font-mono text-xs">{{ store.detail.supplier_message_id || "—" }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">supplier_dispatch_id</div>
                <div class="break-all font-mono text-xs">{{ store.detail.supplier_dispatch_id || "—" }}</div>
              </div>
              <div class="rounded-md border p-3">
                <div class="text-xs text-muted-foreground">Provider / supplier</div>
                <div class="font-mono text-xs">
                  {{ store.detail.provider_slug || "—" }} / {{ store.detail.supplier_slug || "—" }}
                </div>
              </div>
            </div>

            <div v-if="store.detail.error_code || store.detail.error_message" class="rounded-md border border-destructive/50 p-3">
              <div class="text-xs text-muted-foreground">Erro</div>
              <div class="text-sm text-destructive">
                <span v-if="store.detail.error_code" class="font-mono text-xs">{{ store.detail.error_code }}</span>
                {{ store.detail.error_message }}
              </div>
            </div>

            <div class="space-y-2">
              <div class="text-sm font-medium">Mensagem</div>
              <pre class="whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{{ store.detail.message_body || "—" }}</pre>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div v-for="item in timestampItems" :key="item.label">
                <div class="text-xs text-muted-foreground">{{ item.label }}</div>
                <div class="text-sm">{{ item.value }}</div>
              </div>
            </div>

            <div v-if="store.detail.metadata && Object.keys(store.detail.metadata).length" class="space-y-2">
              <div class="text-sm font-medium">metadata</div>
              <pre class="whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{{ prettyJson(store.detail.metadata) }}</pre>
            </div>
          </TabsContent>

          <TabsContent value="timeline" class="pt-2">
            <div v-if="store.events.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum evento registrado.
            </div>

            <ol v-else class="space-y-3">
              <li
                v-for="event in store.events"
                :key="event.id"
                class="rounded-md border p-3 space-y-2"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <Badge variant="secondary">{{ eventSourceLabel(event.event_source) }}</Badge>
                    <SmsStatusBadge v-if="event.normalized_status" :status="event.normalized_status" />
                    <span v-if="event.supplier_status" class="font-mono text-xs text-muted-foreground">
                      supplier: {{ event.supplier_status }}
                    </span>
                  </div>
                  <span class="text-xs text-muted-foreground">{{ formatDateTime(event.occurred_at) }}</span>
                </div>
                <div v-if="event.error_code || event.error_message" class="text-xs text-destructive">
                  <span v-if="event.error_code" class="font-mono">{{ event.error_code }}</span>
                  {{ event.error_message }}
                </div>
                <div class="text-xs text-muted-foreground">
                  processado em {{ formatDateTime(event.processed_at) }}
                  <span v-if="event.supplier_event_id" class="font-mono"> • evento: {{ event.supplier_event_id }}</span>
                </div>
              </li>
            </ol>
          </TabsContent>

          <TabsContent value="payload" class="pt-2">
            <div v-if="eventsWithPayload.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nenhum payload bruto registrado.
            </div>

            <div v-else class="space-y-3">
              <details
                v-for="event in eventsWithPayload"
                :key="event.id"
                class="rounded-md border p-3"
              >
                <summary class="cursor-pointer text-sm">
                  #{{ event.id }} — {{ eventSourceLabel(event.event_source) }}
                  <span class="text-xs text-muted-foreground">({{ formatDateTime(event.occurred_at) }})</span>
                </summary>
                <div class="mt-3 space-y-2">
                  <div class="flex justify-end">
                    <Button variant="outline" size="sm" @click="copyPayload(event)">
                      <Copy class="mr-2 h-4 w-4" />
                      Copiar JSON
                    </Button>
                  </div>
                  <pre class="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-xs">{{ prettyJson(event.payload) }}</pre>
                </div>
              </details>
            </div>
          </TabsContent>
        </Tabs>
      </template>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Fechar</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Loader2 as LucideSpinner, Copy, RefreshCw } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SmsStatusBadge from "@/components/sms/SmsStatusBadge.vue";
import {
  SMS_MESSAGE_EVENT_SOURCE_LABELS,
  type SmsMessageEvent,
  type SmsMessageEventSource,
} from "@/contracts/smsMessages";
import { useSmsHistoryStore } from "@/stores/smsHistory";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "update:open", value: boolean): void }>();

const store = useSmsHistoryStore();

const eventsWithPayload = computed(() =>
  store.events.filter((event) => event.payload && Object.keys(event.payload).length > 0),
);

const timestampItems = computed(() => {
  if (!store.detail) {
    return [];
  }

  return [
    { label: "Solicitado em", value: formatDateTime(store.detail.requested_at) },
    { label: "Aceito em", value: formatDateTime(store.detail.accepted_at) },
    { label: "Na fila em", value: formatDateTime(store.detail.queued_at) },
    { label: "Enviado em", value: formatDateTime(store.detail.sent_at) },
    { label: "Entregue em", value: formatDateTime(store.detail.delivered_at) },
    { label: "Falhou em", value: formatDateTime(store.detail.failed_at) },
    { label: "Cancelado em", value: formatDateTime(store.detail.canceled_at) },
    { label: "Último status em", value: formatDateTime(store.detail.last_status_at) },
  ];
});

const syncFeedback = computed(() => {
  switch (store.lastSyncOutcome) {
    case "updated":
      return { variant: "default" as const, message: "Status atualizado com o retorno do supplier." };
    case "unchanged":
      return { variant: "default" as const, message: "O supplier retornou o mesmo estado já conhecido." };
    case "ignored_regression":
      return {
        variant: "destructive" as const,
        message: "O supplier retornou um estado mais antigo que o atual — nada foi alterado.",
      };
    default:
      return null;
  }
});

async function sync() {
  try {
    await store.syncStatus();
  } catch {
    toast.error("Erro", { description: "Não foi possível consultar o status no supplier." });
  }
}

function eventSourceLabel(source: SmsMessageEventSource) {
  return SMS_MESSAGE_EVENT_SOURCE_LABELS[source] ?? source;
}

async function copyPayload(event: SmsMessageEvent) {
  try {
    await navigator.clipboard.writeText(prettyJson(event.payload));
    toast("Payload copiado para a área de transferência.");
  } catch {
    toast.error("Erro", { description: "Não foi possível copiar o payload." });
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
    new Date(value),
  );
}

function prettyJson(value: unknown) {
  if (value === null || value === undefined) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
</script>
