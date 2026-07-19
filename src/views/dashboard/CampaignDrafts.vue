<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Campaign Builder</h2>
        <p class="text-muted-foreground">
          Liste campanhas draft e configuradas, continue a edição e remova rascunhos quando necessário.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isLoading" @click="fetchCampaigns(1)">Atualizar</Button>
        <Button @click="router.push({ name: 'campaign-drafts.create' })">Nova campanha</Button>
      </div>
    </div>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Falha ao carregar campanhas</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div class="space-y-2">
            <Label>Status</Label>
            <Select v-model="filters.status">
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
                <SelectItem v-for="option in CAMPAIGN_STATUS_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Canal</Label>
            <Select v-model="filters.channel">
              <SelectTrigger>
                <SelectValue placeholder="Todos os canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
                <SelectItem v-for="option in CAMPAIGN_CHANNEL_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Tipo</Label>
            <Select v-model="filters.type">
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="SELECT_ALL_VALUE">Todos</SelectItem>
                <SelectItem v-for="option in CAMPAIGN_TYPE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2 xl:col-span-2">
            <Label>Busca</Label>
            <Input v-model="filters.search" placeholder="Buscar por nome ou descrição" @keydown.enter="fetchCampaigns(1)" />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm text-muted-foreground">
            Projeto ativo: {{ activeProjectLabel }}
          </p>
          <div class="flex flex-wrap gap-2">
            <Button variant="ghost" @click="resetFilters">Limpar filtros</Button>
            <Button :disabled="isLoading" @click="fetchCampaigns(1)">Buscar</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card v-if="!isLoading && campaigns.length === 0 && !errorMessage">
      <CardContent class="pt-6">
        <div class="rounded-md border border-dashed p-8 text-center">
          <div class="text-base font-medium">Nenhuma campanha encontrada.</div>
          <p class="mt-2 text-sm text-muted-foreground">
            Ajuste os filtros ou crie um novo draft para começar o builder.
          </p>
          <Button class="mt-4" @click="router.push({ name: 'campaign-drafts.create' })">Nova campanha</Button>
        </div>
      </CardContent>
    </Card>

    <Card v-else>
      <CardContent class="pt-6">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Agendamento</TableHead>
                <TableHead>Atualização</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="6" class="py-8 text-center text-muted-foreground">
                  Carregando campanhas...
                </TableCell>
              </TableRow>
              <TableRow v-for="item in campaigns" :key="item.id">
                <TableCell class="min-w-[280px]">
                  <div class="space-y-1">
                    <div class="font-medium">{{ item.name }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ item.description || "Sem descrição" }}
                    </div>
                    <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>#{{ item.id }}</span>
                      <span>{{ item.channel }}</span>
                      <span>{{ item.type }}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(item.status)">{{ CAMPAIGN_STATUS_LABELS[item.status] }}</Badge>
                </TableCell>
                <TableCell>{{ item.project?.name || `#${item.project_id}` }}</TableCell>
                <TableCell>
                  <div class="space-y-1 text-sm">
                    <div>{{ item.schedule?.schedule_type || "—" }}</div>
                    <div class="text-xs text-muted-foreground">
                      {{ formatSchedule(item) }}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="space-y-1 text-sm">
                    <div>{{ formatDateTime(item.updated_at) }}</div>
                    <div class="text-xs text-muted-foreground">{{ authorLabel(item) }}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex justify-end gap-2">
                    <Button
                      v-if="item.status !== 'draft' && item.status !== 'validation_failed'"
                      size="sm"
                      @click="openCampaignDetail(item)"
                    >
                      Disparos
                    </Button>
                    <Button variant="outline" size="sm" @click="openCampaign(item)">
                      {{ item.status === "draft" ? "Editar" : "Abrir" }}
                    </Button>
                    <Button
                      v-if="item.status === 'draft'"
                      variant="destructive"
                      size="sm"
                      :disabled="isDeleting && selectedCampaign?.id === item.id"
                      @click="openDeleteDialog(item)"
                    >
                      {{ isDeleting && selectedCampaign?.id === item.id ? "Excluindo..." : "Excluir" }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <CustomPagination
      v-if="campaigns.length > 0 || isLoading"
      :select-page="fetchCampaigns"
      :pages="pages"
      :per_pages="filters.per_page"
      @update:perPages="updatePerPage"
    />

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir campanha draft</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove a campanha <strong>{{ selectedCampaign?.name }}</strong>. Apenas campanhas em rascunho podem ser excluídas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? "Excluindo..." : "Confirmar exclusão" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomPagination from "@/components/custom/CustomPagination.vue";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import {
  CAMPAIGN_CHANNEL_OPTIONS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  type CampaignListItem,
  type CampaignListParams,
  type CampaignStatus,
  type CampaignUserSummary,
} from "@/contracts/campaigns";
import { deleteCampaign, listCampaigns } from "@/services/campaigns";
import { useWorkspaceStore } from "@/stores/workspace";

const router = useRouter();
const workspaceStore = useWorkspaceStore();
const SELECT_ALL_VALUE = "__all__";

const campaigns = ref<CampaignListItem[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");
const isDeleteDialogOpen = ref(false);
const selectedCampaign = ref<CampaignListItem | null>(null);

const filters = reactive<CampaignListParams & { status: CampaignStatus | typeof SELECT_ALL_VALUE | null; channel: "sms" | typeof SELECT_ALL_VALUE | null; type: "broadcast" | typeof SELECT_ALL_VALUE | null }>({
  filter_id: null,
  project_id: null,
  status: SELECT_ALL_VALUE,
  channel: SELECT_ALL_VALUE,
  type: SELECT_ALL_VALUE,
  search: null,
  per_page: 10,
  page: 1,
});

const pages = reactive({
  current: 1,
  total: 0,
  last: 1,
});

const activeProjectId = computed(() => {
  const numeric = Number(workspaceStore.activeGroupProject?.project_id);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
});

const activeProjectLabel = computed(
  () => workspaceStore.activeGroupProject?.name || "Nenhum projeto ativo selecionado",
);

watch(
  activeProjectId,
  async (projectId) => {
    filters.project_id = projectId;
    await fetchCampaigns(1);
  },
  { immediate: true },
);

onMounted(async () => {
  if (!activeProjectId.value) {
    await fetchCampaigns(1);
  }
});

async function fetchCampaigns(page = 1) {
  isLoading.value = true;
  errorMessage.value = "";
  filters.page = page;

  try {
    const response = await listCampaigns(sanitizeFilters());
    campaigns.value = response.data;
    pages.current = response.current_page;
    pages.total = response.total;
    pages.last = response.last_page;
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível carregar a listagem de campanhas.");
    campaigns.value = [];
    pages.current = 1;
    pages.total = 0;
    pages.last = 1;
  } finally {
    isLoading.value = false;
  }
}

function sanitizeFilters(): CampaignListParams {
  return {
    project_id: filters.project_id,
    status: filters.status === SELECT_ALL_VALUE ? null : filters.status,
    channel: filters.channel === SELECT_ALL_VALUE ? null : filters.channel,
    type: filters.type === SELECT_ALL_VALUE ? null : filters.type,
    search: filters.search?.trim() || null,
    per_page: filters.per_page || 10,
    page: filters.page || 1,
  };
}

function resetFilters() {
  filters.status = SELECT_ALL_VALUE;
  filters.channel = SELECT_ALL_VALUE;
  filters.type = SELECT_ALL_VALUE;
  filters.search = null;
  filters.page = 1;
  fetchCampaigns(1);
}

function updatePerPage(value: string) {
  filters.per_page = Number(value) || 10;
  fetchCampaigns(1);
}

function openCampaign(item: CampaignListItem) {
  router.push({ name: "campaign-drafts.edit", params: { id: item.id } });
}

function openCampaignDetail(item: CampaignListItem) {
  router.push({ name: "campaign-drafts.show", params: { id: item.id } });
}

function openDeleteDialog(item: CampaignListItem) {
  selectedCampaign.value = item;
  isDeleteDialogOpen.value = true;
}

async function confirmDelete() {
  if (!selectedCampaign.value || selectedCampaign.value.status !== "draft") {
    return;
  }

  isDeleting.value = true;
  errorMessage.value = "";

  try {
    await deleteCampaign(selectedCampaign.value.id);
    toast({ title: "Campanha draft excluída." });
    isDeleteDialogOpen.value = false;

    const nextPage =
      campaigns.value.length === 1 && pages.current > 1 ? pages.current - 1 : pages.current;
    await fetchCampaigns(nextPage);
  } catch (error) {
    errorMessage.value = getHttpMessage(error, "Não foi possível excluir a campanha.");
  } finally {
    isDeleting.value = false;
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatSchedule(item: CampaignListItem) {
  if (!item.schedule) return "Sem agenda";
  const startsAt = formatDateTime(item.schedule.starts_at);
  return `${item.schedule.timezone || "—"} • ${startsAt}`;
}

function authorLabel(item: CampaignListItem) {
  const author = resolveAuthor(item.updated_by_user || item.updated_by) || resolveAuthor(item.created_by_user || item.created_by);
  if (!author) return "Sem usuário";
  return [author.first_name, author.last_name].filter(Boolean).join(" ") || author.name || author.email || `#${author.id}`;
}

function statusVariant(status: CampaignStatus) {
  if (status === "draft" || status === "validated") return "outline";
  if (status === "validation_failed" || status === "canceled" || status === "archived") return "destructive";
  if (status === "validating" || status === "paused") return "secondary";
  return "default";
}

function getHttpMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    return message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function resolveAuthor(value: CampaignListItem["created_by"] | CampaignUserSummary | null | undefined) {
  if (!value || typeof value === "number") return null;
  return value;
}
</script>
