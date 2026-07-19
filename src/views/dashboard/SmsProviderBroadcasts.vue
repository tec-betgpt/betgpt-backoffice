<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Broadcasts de SMS</h2>
        <p class="text-muted-foreground">
          Todos os envios em massa registrados no SMS Funnel, incluindo os disparos das campanhas do backoffice.
        </p>
      </div>
      <Button variant="outline" :disabled="isLoading" @click="fetchBroadcasts(1)">Atualizar</Button>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Não foi possível concluir a ação</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="filters.status">
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
                <SelectItem v-for="(label, value) in SMS_BROADCAST_STATUS_LABELS" :key="value" :value="value">
                  {{ label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Data inicial</Label>
            <Input v-model="filters.start_date" type="date" />
          </div>
          <div class="space-y-2">
            <Label>Data final</Label>
            <Input v-model="filters.end_date" type="date" />
          </div>
          <div class="space-y-2">
            <Label>Texto da mensagem</Label>
            <Input v-model="filters.text" placeholder="Buscar por conteúdo" @keydown.enter="fetchBroadcasts(1)" />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="ghost" @click="resetFilters">Limpar filtros</Button>
          <Button :disabled="isLoading" @click="fetchBroadcasts(1)">Buscar</Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broadcast</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="text-right">Leads</TableHead>
              <TableHead>Métricas</TableHead>
              <TableHead>Agendado / criado</TableHead>
              <TableHead class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="6" class="py-8 text-center text-muted-foreground">Carregando broadcasts...</TableCell>
            </TableRow>
            <TableRow v-else-if="broadcasts.length === 0">
              <TableCell colspan="6" class="py-8 text-center text-muted-foreground">
                Nenhum broadcast encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
            <TableRow v-for="item in broadcasts" :key="item.id">
              <TableCell class="max-w-[320px]">
                <div class="font-medium">{{ item.name || "Sem nome" }}</div>
                <div class="truncate text-xs text-muted-foreground">{{ item.message }}</div>
                <div class="font-mono text-xs text-muted-foreground">{{ item.id }}</div>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(item.status)">
                  {{ SMS_BROADCAST_STATUS_LABELS[item.status] || item.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">{{ item.leads_count }}</TableCell>
              <TableCell>
                <span v-if="item.metrics" class="text-sm">
                  {{ item.metrics.sent }}/{{ item.metrics.total }} enviadas
                  <span v-if="item.metrics.failed" class="text-destructive">• {{ item.metrics.failed }} falhas</span>
                </span>
                <span v-else class="text-sm text-muted-foreground">—</span>
              </TableCell>
              <TableCell>
                <div class="text-sm">{{ formatDateTime(item.scheduled_date || item.created_at) }}</div>
              </TableCell>
              <TableCell>
                <div class="flex justify-end gap-2">
                  <Button variant="outline" size="sm" @click="openDetail(item)">Detalhes</Button>
                  <Button
                    v-if="canCancel(item.status)"
                    variant="destructive"
                    size="sm"
                    :disabled="isSaving"
                    @click="cancelBroadcast(item)"
                  >
                    Cancelar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div class="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1 || isLoading" @click="fetchBroadcasts(page - 1)">
            Anterior
          </Button>
          <span class="text-sm text-muted-foreground">Página {{ page }}</span>
          <Button variant="outline" size="sm" :disabled="!hasNextPage || isLoading" @click="fetchBroadcasts(page + 1)">
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Detalhe do broadcast -->
    <Sheet :open="isDetailOpen" @update:open="isDetailOpen = $event">
      <SheetContent class="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Broadcast {{ selectedBroadcast?.name || selectedBroadcast?.id }}</SheetTitle>
          <SheetDescription>Métricas e contatos do envio no SMS Funnel.</SheetDescription>
        </SheetHeader>

        <div v-if="selectedBroadcast" class="mt-4 space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader class="pb-2">
                <CardDescription>Enviadas</CardDescription>
                <CardTitle class="text-xl">{{ selectedBroadcast.metrics?.sent ?? "—" }}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader class="pb-2">
                <CardDescription>Falhas</CardDescription>
                <CardTitle class="text-xl">{{ selectedBroadcast.metrics?.failed ?? "—" }}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader class="pb-2">
                <CardDescription>Total</CardDescription>
                <CardTitle class="text-xl">{{ selectedBroadcast.metrics?.total ?? selectedBroadcast.leads_count }}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div class="rounded-md border p-3 text-sm">
            <div class="font-medium">Mensagem</div>
            <p class="mt-1 whitespace-pre-wrap text-muted-foreground">{{ selectedBroadcast.message }}</p>
          </div>

          <div class="flex items-center justify-between">
            <Label>Contatos</Label>
            <Input
              v-model="contactsPhoneFilter"
              class="max-w-[200px]"
              placeholder="Filtrar por telefone"
              @keydown.enter="fetchContacts(1)"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cancelada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoadingContacts">
                <TableCell colspan="3" class="py-6 text-center text-muted-foreground">Carregando contatos...</TableCell>
              </TableRow>
              <TableRow v-else-if="contacts.length === 0">
                <TableCell colspan="3" class="py-6 text-center text-muted-foreground">Nenhum contato encontrado.</TableCell>
              </TableRow>
              <TableRow v-for="contact in contacts" :key="contact.id">
                <TableCell class="font-mono text-sm">{{ contact.phone }}</TableCell>
                <TableCell>
                  <Badge :variant="messageStatusVariant(contact.status)">
                    {{ SMS_MESSAGE_STATUS_LABELS[contact.status] || contact.status }}
                  </Badge>
                </TableCell>
                <TableCell>{{ contact.cancelled ? "Sim" : "Não" }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div class="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="contactsPage <= 1 || isLoadingContacts"
              @click="fetchContacts(contactsPage - 1)"
            >
              Anterior
            </Button>
            <span class="text-sm text-muted-foreground">Página {{ contactsPage }}</span>
            <Button
              variant="outline"
              size="sm"
              :disabled="!hasNextContactsPage || isLoadingContacts"
              @click="fetchContacts(contactsPage + 1)"
            >
              Próxima
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  SMS_BROADCAST_STATUS_LABELS,
  SMS_MESSAGE_STATUS_LABELS,
  type SmsBroadcast,
  type SmsBroadcastContact,
  type SmsBroadcastStatus,
  type SmsMessageStatus,
} from "@/contracts/smsProvider";
import {
  cancelSmsBroadcast,
  getSmsBroadcast,
  listSmsBroadcastContacts,
  listSmsBroadcasts,
} from "@/services/smsProvider";

const SELECT_ALL_VALUE = "__all__";

const broadcasts = ref<SmsBroadcast[]>([]);
const contacts = ref<SmsBroadcastContact[]>([]);
const selectedBroadcast = ref<SmsBroadcast | null>(null);
const isLoading = ref(false);
const isLoadingContacts = ref(false);
const isSaving = ref(false);
const isDetailOpen = ref(false);
const errorMessage = ref("");
const page = ref(1);
const hasNextPage = ref(false);
const contactsPage = ref(1);
const hasNextContactsPage = ref(false);
const contactsPhoneFilter = ref("");

const filters = reactive({
  status: SELECT_ALL_VALUE as string,
  start_date: "",
  end_date: "",
  text: "",
});

onMounted(() => fetchBroadcasts(1));

async function fetchBroadcasts(targetPage = 1) {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listSmsBroadcasts({
      status: filters.status === SELECT_ALL_VALUE ? null : filters.status,
      start_date: filters.start_date || null,
      end_date: filters.end_date || null,
      text: filters.text.trim() || null,
      per_page: 20,
      page: targetPage,
    });

    broadcasts.value = response.data || [];
    page.value = response.current_page || targetPage;
    hasNextPage.value = Boolean(response.next_page_url);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar os broadcasts do SMS Funnel.");
    broadcasts.value = [];
  } finally {
    isLoading.value = false;
  }
}

function resetFilters() {
  filters.status = SELECT_ALL_VALUE;
  filters.start_date = "";
  filters.end_date = "";
  filters.text = "";
  fetchBroadcasts(1);
}

async function openDetail(item: SmsBroadcast) {
  selectedBroadcast.value = item;
  contactsPhoneFilter.value = "";
  isDetailOpen.value = true;

  try {
    selectedBroadcast.value = await getSmsBroadcast(item.id);
  } catch {
    // mantém os dados da listagem
  }

  await fetchContacts(1);
}

async function fetchContacts(targetPage = 1) {
  if (!selectedBroadcast.value) return;

  isLoadingContacts.value = true;

  try {
    const response = await listSmsBroadcastContacts(selectedBroadcast.value.id, {
      phone: contactsPhoneFilter.value.trim() || null,
      per_page: 20,
      page: targetPage,
    });

    contacts.value = response.data || [];
    contactsPage.value = response.current_page || targetPage;
    hasNextContactsPage.value = Boolean(response.next_page_url);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar os contatos do broadcast.");
    contacts.value = [];
  } finally {
    isLoadingContacts.value = false;
  }
}

async function cancelBroadcast(item: SmsBroadcast) {
  isSaving.value = true;
  errorMessage.value = "";

  try {
    await cancelSmsBroadcast(item.id);
    toast({ title: "Broadcast cancelado (mensagens pendentes não serão enviadas)." });
    await fetchBroadcasts(page.value);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível cancelar o broadcast.");
  } finally {
    isSaving.value = false;
  }
}

function canCancel(status: SmsBroadcastStatus) {
  return ["pending", "scheduled", "sending", "importing", "sanitizing"].includes(status);
}

function statusVariant(status: SmsBroadcastStatus) {
  if (status === "cancelled") return "destructive";
  if (status === "sent_with_errors") return "secondary";
  if (status === "sent") return "default";
  return "outline";
}

function messageStatusVariant(status: SmsMessageStatus) {
  if (status === "delivered") return "default";
  if (status === "failed" || status === "undelivered") return "destructive";
  if (status === "sent") return "secondary";
  return "outline";
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
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
