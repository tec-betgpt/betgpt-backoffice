<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Teste de SMS</h2>
      <p class="text-muted-foreground">
        Envie mensagens de teste pelo SMS Funnel e acompanhe o status da entrega em tempo real.
      </p>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível enviar a mensagem</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <div class="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nova mensagem de teste</CardTitle>
          <CardDescription>Até 10 telefones por envio. Use DDI+DDD+número (ex.: 5511999999999).</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Telefones</Label>
            <Input
              v-model="phonesInput"
              placeholder="5511999999999, 5521988888888"
              :disabled="isSending"
            />
            <p class="text-xs text-muted-foreground">Separe múltiplos telefones por vírgula.</p>
          </div>

          <div class="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              v-model="message"
              rows="5"
              maxlength="1530"
              placeholder="Olá! Esta é uma mensagem de teste. Acesse {meu_link}"
              :disabled="isSending"
            />
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ message.length }} / 1530 caracteres • {{ segmentsCount }} segmento(s) SMS</span>
              <span v-if="hasMeuLink">Contém {meu_link}</span>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Link</Label>
            <Input v-model="url" placeholder="https://exemplo.com/promo" :disabled="isSending" />
            <p class="text-xs text-muted-foreground">
              Opcional. Para usar o encurtador, inclua <code>{meu_link}</code> no texto da mensagem e informe a URL aqui.
            </p>
          </div>

          <div class="flex justify-end">
            <Button :disabled="!canSend || isSending" @click="send">
              {{ isSending ? "Enviando..." : "Enviar teste" }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div class="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Mensagens enviadas</CardTitle>
              <CardDescription>
                Status consultado pelo broadcast_id do envio. Atualiza a cada 10 segundos.
              </CardDescription>
            </div>
            <Button
              v-if="sentMessages.length"
              variant="outline"
              size="sm"
              :disabled="isRefreshing"
              @click="refreshStatuses"
            >
              {{ isRefreshing ? "Atualizando..." : "Atualizar status" }}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="sentMessages.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem de teste enviada nesta sessão.
          </div>
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Broadcast</TableHead>
                <TableHead>Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in sentMessages" :key="item.id">
                <TableCell class="font-mono text-sm">{{ item.phone }}</TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(item.status)">
                    {{ SMS_MESSAGE_STATUS_LABELS[item.status] || item.status }}
                  </Badge>
                </TableCell>
                <TableCell class="font-mono text-xs text-muted-foreground">
                  {{ item.broadcast_status || "—" }}
                </TableCell>
                <TableCell>{{ formatDateTime(item.updated_at) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  SMS_MESSAGE_STATUS_LABELS,
  type SmsBroadcastStatus,
  type SmsMessageStatus,
} from "@/contracts/smsProvider";
import { getSmsBroadcast, listSmsBroadcastContacts, sendTestMessage } from "@/services/smsProvider";
import { useWorkspaceStore } from "@/stores/workspace";

type SentMessage = {
  id: string;
  broadcast_id: string;
  phone: string;
  status: SmsMessageStatus;
  broadcast_status: SmsBroadcastStatus | string | null;
  updated_at: string | null;
};

const FINAL_MESSAGE_STATUSES: SmsMessageStatus[] = ["delivered", "failed", "undelivered"];

const workspaceStore = useWorkspaceStore();
const phonesInput = ref("");
const message = ref("");
const url = ref("");
const isSending = ref(false);
const isRefreshing = ref(false);
const errorMessage = ref("");
const sentMessages = ref<SentMessage[]>([]);
let pollTimer: number | null = null;

const hasMeuLink = computed(() => message.value.includes("{meu_link}"));
const segmentsCount = computed(() => Math.max(Math.ceil(message.value.length / 160), 1));
const canSend = computed(() => {
  const phones = parsePhones();
  const hasPhonesAndMessage = phones.length > 0 && message.value.trim().length > 0;

  if (!hasPhonesAndMessage) return false;
  if (hasMeuLink.value && !url.value.trim()) return false;
  if (url.value.trim() && !hasMeuLink.value) return false;

  return true;
});

function requireFilterId(): string | null {
  const id = workspaceStore.activeGroupProject?.id;
  if (!id) {
    errorMessage.value = "Selecione um projeto no workspace para operar o SMS Funnel.";
    return null;
  }
  return id;
}

onMounted(() => {
  pollTimer = window.setInterval(() => {
    if (hasPendingStatuses()) {
      refreshStatuses(false);
    }
  }, 10000);
});

onBeforeUnmount(() => {
  if (pollTimer) window.clearInterval(pollTimer);
});

function parsePhones(): string[] {
  return phonesInput.value
    .split(/[,;\n]/)
    .map((phone) => phone.trim())
    .filter(Boolean);
}

function hasPendingStatuses() {
  return sentMessages.value.some((item) => !FINAL_MESSAGE_STATUSES.includes(item.status));
}

async function send() {
  errorMessage.value = "";
  const filter_id = requireFilterId();
  if (!filter_id) return;

  if (url.value.trim() && !hasMeuLink.value) {
    errorMessage.value = "Para usar o Link, inclua {meu_link} no texto da mensagem.";
    return;
  }

  if (hasMeuLink.value && !url.value.trim()) {
    errorMessage.value = "Informe o Link quando a mensagem contém {meu_link}.";
    return;
  }

  isSending.value = true;

  try {
    const response = await sendTestMessage({
      filter_id,
      phones: parsePhones(),
      message: message.value,
      url: hasMeuLink.value ? url.value.trim() : undefined,
    });

    const broadcastId = response.broadcast_id;
    const now = new Date().toISOString();

    const items: SentMessage[] = (response.messages || []).map((item) => ({
      id: item.id,
      broadcast_id: broadcastId,
      phone: item.phone,
      status: item.status,
      broadcast_status: "pending",
      updated_at: now,
    }));

    sentMessages.value = [...items, ...sentMessages.value];
    toast({ title: `Mensagem de teste enviada para ${items.length} telefone(s).` });

    if (broadcastId) {
      await refreshBroadcast(broadcastId, filter_id);
    }
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível enviar a mensagem de teste.");
  } finally {
    isSending.value = false;
  }
}

async function refreshStatuses(showLoading = true) {
  if (sentMessages.value.length === 0) return;

  const filter_id = requireFilterId();
  if (!filter_id) return;

  if (showLoading) isRefreshing.value = true;

  try {
    const pendingBroadcastIds = [
      ...new Set(
        sentMessages.value
          .filter((item) => !FINAL_MESSAGE_STATUSES.includes(item.status))
          .map((item) => item.broadcast_id)
          .filter(Boolean),
      ),
    ];

    await Promise.allSettled(pendingBroadcastIds.map((broadcastId) => refreshBroadcast(broadcastId, filter_id)));
  } finally {
    isRefreshing.value = false;
  }
}

async function refreshBroadcast(broadcastId: string, filter_id: string) {
  const [broadcastResult, contactsResult] = await Promise.allSettled([
    getSmsBroadcast(broadcastId, { filter_id }),
    listSmsBroadcastContacts(broadcastId, { filter_id, per_page: 100, page: 1 }),
  ]);

  const now = new Date().toISOString();
  const broadcastStatus =
    broadcastResult.status === "fulfilled" ? broadcastResult.value.status : null;

  if (contactsResult.status === "fulfilled") {
    const contacts = contactsResult.value.data || [];

    for (const contact of contacts) {
      const index = sentMessages.value.findIndex(
        (item) => item.id === contact.id || (item.broadcast_id === broadcastId && item.phone === contact.phone),
      );

      if (index < 0) continue;

      sentMessages.value[index] = {
        ...sentMessages.value[index],
        status: contact.cancelled ? "failed" : contact.status,
        broadcast_status: broadcastStatus ?? sentMessages.value[index].broadcast_status,
        updated_at: now,
      };
    }
  }

  if (broadcastStatus) {
    sentMessages.value = sentMessages.value.map((item) =>
      item.broadcast_id === broadcastId
        ? { ...item, broadcast_status: broadcastStatus, updated_at: item.updated_at || now }
        : item,
    );
  }
}

function statusVariant(status: SmsMessageStatus) {
  if (status === "delivered") return "default";
  if (status === "failed" || status === "undelivered") return "destructive";
  if (status === "sent") return "secondary";
  return "outline";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
</script>
