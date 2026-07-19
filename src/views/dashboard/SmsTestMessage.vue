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

          <div v-if="hasMeuLink" class="space-y-2">
            <Label>URL do {meu_link}</Label>
            <Input v-model="url" placeholder="https://exemplo.com/promo" :disabled="isSending" />
            <p class="text-xs text-muted-foreground">Obrigatória quando a mensagem contém a variável {meu_link}.</p>
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
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Mensagens enviadas</CardTitle>
              <CardDescription>Status atualizado automaticamente a cada 10 segundos.</CardDescription>
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
                <TableHead>Enviada em</TableHead>
                <TableHead>Entregue em</TableHead>
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
                <TableCell>{{ formatDateTime(item.sent_at) }}</TableCell>
                <TableCell>{{ formatDateTime(item.delivered_at) }}</TableCell>
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
import { SMS_MESSAGE_STATUS_LABELS, type SmsMessageStatus } from "@/contracts/smsProvider";
import { getTestMessage, sendTestMessage } from "@/services/smsProvider";

type SentMessage = {
  id: string;
  phone: string;
  status: SmsMessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
};

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
  return phones.length > 0 && message.value.trim().length > 0 && (!hasMeuLink.value || url.value.trim().length > 0);
});

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
  return sentMessages.value.some((item) => item.status === "queued" || item.status === "sent");
}

async function send() {
  errorMessage.value = "";
  isSending.value = true;

  try {
    const response = await sendTestMessage({
      phones: parsePhones(),
      message: message.value,
      url: hasMeuLink.value ? url.value.trim() : undefined,
    });

    const items: SentMessage[] = (response.messages || []).map((item) => ({
      id: item.id,
      phone: item.phone,
      status: item.status,
      sent_at: null,
      delivered_at: null,
    }));

    sentMessages.value = [...items, ...sentMessages.value];
    toast({ title: `Mensagem de teste enviada para ${items.length} telefone(s).` });
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível enviar a mensagem de teste.");
  } finally {
    isSending.value = false;
  }
}

async function refreshStatuses(showLoading = true) {
  if (sentMessages.value.length === 0) return;

  if (showLoading) isRefreshing.value = true;

  try {
    const pending = sentMessages.value.filter((item) => item.status === "queued" || item.status === "sent");
    const updates = await Promise.allSettled(pending.map((item) => getTestMessage(item.id)));

    updates.forEach((result) => {
      if (result.status !== "fulfilled" || !result.value) return;

      const index = sentMessages.value.findIndex((item) => item.id === result.value.id);
      if (index >= 0) {
        sentMessages.value[index] = {
          ...sentMessages.value[index],
          status: result.value.status,
          sent_at: result.value.sent_at,
          delivered_at: result.value.delivered_at,
        };
      }
    });
  } finally {
    isRefreshing.value = false;
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
