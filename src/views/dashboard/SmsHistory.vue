<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Histórico de SMS</h2>
        <p class="text-muted-foreground">
          Histórico técnico e troubleshooting dos envios diretos de SMS.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="store.loadingList || !hasProject"
        @click="refresh"
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        {{ store.loadingList ? "Atualizando..." : "Atualizar" }}
      </Button>
    </div>

    <Alert v-if="store.listError" variant="destructive">
      <AlertTitle>Não foi possível carregar o histórico</AlertTitle>
      <AlertDescription>{{ store.listError }}</AlertDescription>
    </Alert>

    <Card>
      <CardContent class="space-y-4 pt-6">
        <div class="grid gap-4 md:grid-cols-4">
          <div class="space-y-2">
            <Label for="sms-history-project">Projeto</Label>
            <Input
              v-if="isSingleProject"
              id="sms-history-project"
              :model-value="activeGroupProject?.name"
              disabled
            />
            <Select v-else v-model="filterForm.project_id">
              <SelectTrigger id="sms-history-project">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="project in projectOptions"
                  :key="project.id"
                  :value="String(project.project_id)"
                >
                  {{ project.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="filterForm.status">
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
                <SelectItem
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Telefone</Label>
            <Input v-model="filterForm.recipient_phone" placeholder="99998888" />
          </div>

          <div class="space-y-2">
            <Label>ID da mensagem (supplier)</Label>
            <Input v-model="filterForm.supplier_message_id" placeholder="msg-..." />
          </div>

          <div class="space-y-2">
            <Label>Solicitado de</Label>
            <Input v-model="filterForm.requested_from" type="date" />
          </div>

          <div class="space-y-2">
            <Label>Solicitado até</Label>
            <Input v-model="filterForm.requested_to" type="date" />
          </div>

          <div class="space-y-2">
            <Label>Por página</Label>
            <Select v-model="filterForm.per_page">
              <SelectTrigger>
                <SelectValue placeholder="25" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="value in PER_PAGE_OPTIONS" :key="value" :value="String(value)">
                  {{ value }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p v-if="dateRangeError" class="text-xs text-destructive">{{ dateRangeError }}</p>

        <div class="flex flex-wrap items-center gap-2">
          <Button :disabled="store.loadingList || !hasProject" @click="applyFilters">
            Aplicar filtros
          </Button>
          <Button variant="outline" :disabled="store.loadingList" @click="clearFilters">
            Limpar
          </Button>
          <div class="ml-auto text-sm text-muted-foreground">
            {{ store.pagination.total }} resultado(s)
          </div>
        </div>

        <p v-if="!hasProject" class="text-sm text-muted-foreground">
          Selecione um projeto para consultar o histórico.
        </p>

        <div v-else class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UUID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>supplier_status</TableHead>
                <TableHead>supplier_message_id</TableHead>
                <TableHead>supplier_dispatch_id</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="store.loadingList && store.items.length === 0">
                <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                  Carregando histórico...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="store.items.length === 0">
                <TableCell colspan="7" class="h-24 text-center text-muted-foreground">
                  Nenhuma mensagem encontrada.
                </TableCell>
              </TableRow>

              <TableRow v-for="item in store.items" :key="item.id">
                <TableCell
                  class="max-w-[120px] truncate font-mono text-xs"
                  :title="item.uuid"
                >
                  {{ item.uuid }}
                </TableCell>
                <TableCell>
                  <SmsStatusBadge :status="item.status" />
                </TableCell>
                <TableCell class="font-mono text-xs">{{ item.supplier_status || "—" }}</TableCell>
                <TableCell
                  class="max-w-[140px] truncate font-mono text-xs text-muted-foreground"
                  :title="item.supplier_message_id || undefined"
                >
                  {{ item.supplier_message_id || "—" }}
                </TableCell>
                <TableCell
                  class="max-w-[140px] truncate font-mono text-xs text-muted-foreground"
                  :title="item.supplier_dispatch_id || undefined"
                >
                  {{ item.supplier_dispatch_id || "—" }}
                </TableCell>
                <TableCell class="text-xs">{{ formatDateTime(item.requested_at) }}</TableCell>
                <TableCell class="text-right">
                  <Button size="sm" variant="outline" @click="openDetails(item)">
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div v-if="store.pagination.last_page > 1" class="flex flex-wrap items-center justify-between gap-3">
          <Pagination
            v-model:page="pageModel"
            :total="store.pagination.total"
            :items-per-page="store.pagination.per_page"
            :sibling-count="1"
            show-edges
          >
            <PaginationList v-slot="{ items }" class="flex items-center gap-2">
              <PaginationFirst />
              <PaginationPrev />

              <template v-for="(item, index) in items" :key="index">
                <PaginationListItem v-if="item.type === 'page'" :value="item.value" as-child>
                  <Button
                    class="min-h-9 min-w-9 p-2"
                    :variant="item.value === store.pagination.current_page ? 'default' : 'outline'"
                  >
                    {{ item.value }}
                  </Button>
                </PaginationListItem>
                <PaginationEllipsis v-else :index="index" />
              </template>

              <PaginationNext />
              <PaginationLast />
            </PaginationList>
          </Pagination>

          <div class="text-sm text-muted-foreground">
            Página {{ store.pagination.current_page }} de {{ store.pagination.last_page }}
          </div>
        </div>
      </CardContent>
    </Card>

    <SmsMessageDetailDialog v-model:open="isDetailsOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RefreshCw } from "lucide-vue-next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SmsMessageDetailDialog from "@/components/sms/SmsMessageDetailDialog.vue";
import SmsStatusBadge from "@/components/sms/SmsStatusBadge.vue";
import {
  SMS_MESSAGE_STATUS_LABELS,
  type SmsMessageListItem,
  type SmsMessageStatus,
  type SmsMessagesFilters,
} from "@/contracts/smsMessages";
import { useSmsHistoryStore } from "@/stores/smsHistory";
import { useWorkspaceStore } from "@/stores/workspace";

const SELECT_ALL_VALUE = "__all__";
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

const store = useSmsHistoryStore();
const workspaceStore = useWorkspaceStore();

const filterForm = reactive({
  project_id: "",
  status: SELECT_ALL_VALUE as string,
  recipient_phone: "",
  requested_from: "",
  requested_to: "",
  supplier_message_id: "",
  per_page: "25",
});

const dateRangeError = ref("");
const isDetailsOpen = ref(false);

const activeGroupProject = computed(() => workspaceStore.activeGroupProject);
const isSingleProject = computed(() => activeGroupProject.value?.type === "project");

const projectOptions = computed(() =>
  (workspaceStore.group_projects as Array<{ id: string; project_id: string; name: string; type: string }>)
    .filter((project) => project.type === "project"),
);

const statusOptions = Object.entries(SMS_MESSAGE_STATUS_LABELS).map(([value, label]) => ({
  value: value as SmsMessageStatus,
  label,
}));

const hasProject = computed(() => Boolean(resolvedProjectId()));

const pageModel = computed({
  get: () => store.pagination.current_page,
  set: async (page: number) => {
    try {
      await store.setPage(page);
    } catch {
      // Erro exibido via store.listError.
    }
  },
});

function resolvedProjectId(): string | null {
  if (isSingleProject.value) {
    return activeGroupProject.value?.project_id ?? null;
  }

  return filterForm.project_id || null;
}

function buildFilters(): SmsMessagesFilters | null {
  dateRangeError.value = "";

  if (
    filterForm.requested_from &&
    filterForm.requested_to &&
    filterForm.requested_to < filterForm.requested_from
  ) {
    dateRangeError.value = "A data final deve ser maior ou igual à data inicial.";
    return null;
  }

  return {
    project_id: resolvedProjectId(),
    status:
      filterForm.status === SELECT_ALL_VALUE
        ? null
        : (filterForm.status as SmsMessageStatus),
    recipient_phone: filterForm.recipient_phone.trim() || null,
    requested_from: filterForm.requested_from || null,
    requested_to: filterForm.requested_to || null,
    supplier_message_id: filterForm.supplier_message_id.trim() || null,
    per_page: Number(filterForm.per_page) || 25,
  };
}

async function applyFilters() {
  if (!hasProject.value) {
    return;
  }

  const filters = buildFilters();
  if (!filters) {
    return;
  }

  try {
    await store.setFilters(filters);
  } catch {
    // Erro exibido via store.listError.
  }
}

async function clearFilters() {
  filterForm.status = SELECT_ALL_VALUE;
  filterForm.recipient_phone = "";
  filterForm.requested_from = "";
  filterForm.requested_to = "";
  filterForm.supplier_message_id = "";
  filterForm.per_page = "25";
  dateRangeError.value = "";

  await applyFilters();
}

async function refresh() {
  try {
    await store.fetchMessages();
  } catch {
    // Erro exibido via store.listError.
  }
}

async function openDetails(item: SmsMessageListItem) {
  isDetailsOpen.value = true;

  try {
    await store.fetchDetail(item.id);
  } catch {
    // Erro exibido no dialog via store.detailError.
  }
}

watch(isDetailsOpen, (open) => {
  if (!open) {
    store.clearDetail();
  }
});

watch(isSingleProject, () => {
  // Troca de workspace: recarrega com o novo contexto de projeto.
  if (hasProject.value) {
    applyFilters();
  }
});

onMounted(() => {
  if (hasProject.value) {
    applyFilters();
  }
});

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(
    new Date(value),
  );
}
</script>
