<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div v-if="slugLoading" class="space-y-4">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-96" />
    </div>

    <div v-else-if="!hasSlug" class="flex flex-col items-center justify-center py-20 space-y-6">
      <AlertCircle class="h-16 w-16 text-muted-foreground" />
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Slug não configurado</h2>
        <p class="text-muted-foreground max-w-md">
          Para acessar a tela de Links, é necessário configurar um slug para o projeto.
          O slug é um identificador amigável usado em outras partes do sistema.
        </p>
      </div>
      <Button @click="router.push({ name: 'project-preferences' })">
        <Settings2 class="h-4 w-4 mr-2" />
        Configurar Slug
      </Button>
    </div>

    <template v-else>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Gestão de Links</h2>
        <p class="text-muted-foreground">
          Gerencie links, versões de destino, UTM snapshots e arquivamento.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button @click="isCreateDialogOpen = true">
          Novo Link
        </Button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full sm:max-w-[320px]">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="filters.search"
          class="pl-8"
          placeholder="Buscar por código ou slug"
          @input="scheduleSearch"
          @keydown.enter="fetchLinks(1)"
        />
      </div>

      <Select v-model="filters.status" @update:model-value="fetchLinks(1)">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="SELECT_ALL_VALUE">Todos os status</SelectItem>
          <SelectItem v-for="option in LINK_STATUS_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="filters.type" @update:model-value="fetchLinks(1)">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Todos os tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="SELECT_ALL_VALUE">Todos os tipos</SelectItem>
          <SelectItem v-for="option in LINK_TYPE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" @click="resetFilters()">Limpar filtros</Button>

      <ColumnVisibilityToggle
        v-model="columnVisibility"
        :columns="tableColumns"
        table="links"
        class="ml-auto"
      />
    </div>

    <Card>
      <CardContent class="pt-6">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead v-if="columnVisibility.status !== false">Status</TableHead>
                <TableHead v-if="columnVisibility.codigo !== false">Código</TableHead>
                <TableHead v-if="isGroupWorkspace && columnVisibility.projeto !== false">Projeto</TableHead>
                <TableHead v-if="columnVisibility.totalCliques !== false" class="text-right">Total de Cliques</TableHead>
                <TableHead v-if="columnVisibility.cliques24h !== false" class="text-right">Cliques 24h</TableHead>
                <TableHead v-if="columnVisibility.ultimoClique !== false">Último clique</TableHead>
                <TableHead v-if="columnVisibility.encurtador !== false">Encurtador</TableHead>
                <TableHead v-if="columnVisibility.destino !== false">Destino</TableHead>
                <TableHead v-if="columnVisibility.tracking !== false">Trackeamento</TableHead>
                <TableHead v-if="columnVisibility.slug !== false">Slug</TableHead>
                <TableHead v-if="columnVisibility.tipo !== false">Tipo</TableHead>
                <TableHead v-if="columnVisibility.acoes !== false" class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell :colspan="visibleTableColumns.length" class="py-8 text-center text-muted-foreground">
                  Carregando links...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="links.length === 0">
                <TableCell :colspan="visibleTableColumns.length" class="py-8 text-center text-muted-foreground">
                  Nenhum link encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
              <TableRow v-for="link in links" :key="link.id">
                <TableCell v-if="columnVisibility.status !== false">
                  <LinkStatusIndicator :status="link.status" />
                </TableCell>
                <TableCell v-if="columnVisibility.codigo !== false">
                  <button
                    type="button"
                    class="font-medium hover:underline"
                    title="Abrir detalhes do link"
                    @click="openDetails(link.id)"
                  >
                    {{ link.code }}
                  </button>
                </TableCell>
                <TableCell v-if="isGroupWorkspace && columnVisibility.projeto !== false">
                  <Badge v-if="link.project" variant="secondary" class="gap-1.5 py-1 pr-2">
                    <ProjectAvatar :name="link.project.name" :logo-url="link.project.logo_url" class="h-4 w-4" />
                    <span class="max-w-[140px] truncate">{{ link.project.name }}</span>
                  </Badge>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell v-if="columnVisibility.totalCliques !== false" class="text-right font-medium">
                  {{ formatClickCount(getLinkClickMetrics(link).total) }}
                </TableCell>
                <TableCell v-if="columnVisibility.cliques24h !== false" class="text-right font-medium">
                  {{ formatClickCount(getLinkClickMetrics(link).last24h) }}
                </TableCell>
                <TableCell v-if="columnVisibility.ultimoClique !== false" class="whitespace-nowrap text-sm">
                  {{ formatDateTime(link.last_click_at) }}
                </TableCell>
                <TableCell v-if="columnVisibility.encurtador !== false" class="max-w-[280px] font-medium">
                  <CopyableCell :value="link.short_url" label="Encurtador" class="max-w-[280px]">
                    <span class="truncate">{{ link.short_url || "—" }}</span>
                  </CopyableCell>
                </TableCell>
                <TableCell v-if="columnVisibility.destino !== false" class="max-w-[280px]">
                  <CopyableCell :value="getDestinationUrl(link)" label="Destino" class="max-w-[280px]">
                    <span class="truncate">{{ getDestinationUrl(link) }}</span>
                  </CopyableCell>
                </TableCell>
                <TableCell v-if="columnVisibility.tracking !== false">
                  <LinkTrackingBadge :tracking="link.tracking" />
                </TableCell>
                <TableCell v-if="columnVisibility.slug !== false">{{ link.slug || "—" }}</TableCell>
                <TableCell v-if="columnVisibility.tipo !== false">{{ link.type || "—" }}</TableCell>
                <TableCell v-if="columnVisibility.acoes !== false">
                  <div class="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-8 w-8" title="Ações">
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" class="w-11 min-w-0 p-1">
                        <DropdownMenuItem
                          class="justify-center"
                          title="Editar"
                          aria-label="Editar"
                          @click="openEditDialog(link.id)"
                        >
                          <Pencil class="h-4 w-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          class="justify-center"
                          title="Detalhes"
                          aria-label="Detalhes"
                          @click="openDetails(link.id)"
                        >
                          <Eye class="h-4 w-4" />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          class="justify-center text-destructive"
                          title="Arquivar"
                          aria-label="Arquivar"
                          @click="openArchiveDialog(link)"
                        >
                          <Archive class="h-4 w-4" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <CustomPagination
      :select-page="fetchLinks"
      :pages="pages"
      :per_pages="filters.per_page"
      @update:perPages="updatePerPage"
    />

    <CreateDialogComponent
      v-model:open="isCreateDialogOpen"
      :refresh-list="fetchLinks"
    />

    <EditDialogComponent
      v-model:open="isEditDialogOpen"
      :link-id="editingLinkId"
      :current-page="pages.current"
      :refresh-list="fetchLinks"
    />

    <LinkDetailsSheet
      v-model:open="isDetailsOpen"
      :link-id="selectedLinkId"
      :refresh-list="fetchLinks"
    />

    <AlertDialog :open="isArchiveDialogOpen" @update:open="isArchiveDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Arquivar link</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja arquivar o link <strong>{{ selectedLinkForArchive?.code }}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction :disabled="isArchiving" @click="confirmArchive()">
            {{ isArchiving ? "Arquivando..." : "Confirmar" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { toast } from "vue-sonner";
import linksService from "@/services/links";
import ProjectPreferencesService from "@/services/projectPreferences";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import ColumnVisibilityToggle from "@/components/custom/ColumnVisibilityToggle.vue";
import ProjectAvatar from "@/components/custom/ProjectAvatar.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useRouter } from "vue-router";
import CreateDialogComponent from "@/components/links/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/links/EditDialogComponent.vue";
import LinkDetailsSheet from "@/components/links/LinkDetailsSheet.vue";
import LinkStatusIndicator from "@/components/links/LinkStatusIndicator.vue";
import LinkTrackingBadge from "@/components/links/LinkTrackingBadge.vue";
import CopyableCell from "@/components/custom/CopyableCell.vue";
import { AlertCircle, Archive, Eye, MoreHorizontal, Pencil, Search, Settings2 } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { LinkListItem } from "@/contracts/link";
import {
  LINK_STATUS_OPTIONS,
  LINK_TYPE_OPTIONS,
} from "@/contracts/link";
import {
  getDestinationUrl,
  SELECT_ALL_VALUE,
} from "@/components/links/linkForm";
import {
  formatClickCount,
  getLinkClickMetrics,
} from "@/components/links/linkClicks";

const workspaceStore = useWorkspaceStore();
const router = useRouter();
const isGroupWorkspace = computed(() => workspaceStore.activeGroupProject?.type === "group");

const slugLoading = ref(true);
const hasSlug = ref(false);

const projectIdNumber = computed(() => workspaceStore.numericProjectId);

const checkSlug = async () => {
  if (projectIdNumber.value === null) {
    hasSlug.value = false;
    slugLoading.value = false;
    return;
  }

  slugLoading.value = true;
  try {
    const response = await ProjectPreferencesService.show(projectIdNumber.value);
    hasSlug.value = !!(response?.data?.slug?.trim());
  } catch {
    hasSlug.value = false;
  } finally {
    slugLoading.value = false;
  }
};

const links = ref<LinkListItem[]>([]);
const isLoading = ref(false);

const tableColumns = computed(() => [
  { id: "status", label: "Status" },
  { id: "codigo", label: "Código" },
  ...(isGroupWorkspace.value ? [{ id: "projeto", label: "Projeto" }] : []),
  { id: "totalCliques", label: "Total de Cliques" },
  { id: "cliques24h", label: "Cliques 24h" },
  { id: "ultimoClique", label: "Último clique" },
  { id: "encurtador", label: "Encurtador" },
  { id: "destino", label: "Destino" },
  { id: "tracking", label: "Trackeamento" },
  { id: "slug", label: "Slug" },
  { id: "tipo", label: "Tipo" },
  { id: "acoes", label: "Ações" },
]);
const columnVisibility = ref<Record<string, boolean>>({
  slug: false,
  tipo: false,
});
const visibleTableColumns = computed(() =>
  tableColumns.value.filter((c) => columnVisibility.value[c.id] !== false)
);
const isArchiving = ref(false);
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDetailsOpen = ref(false);
const isArchiveDialogOpen = ref(false);
const selectedLinkId = ref<number | null>(null);
const selectedLinkForArchive = ref<LinkListItem | null>(null);
const editingLinkId = ref<number | null>(null);

const filters = reactive({
  status: SELECT_ALL_VALUE,
  type: SELECT_ALL_VALUE,
  search: "",
  per_page: "25",
});

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

let searchDebounceId: number | null = null;

function scheduleSearch() {
  if (searchDebounceId !== null) {
    window.clearTimeout(searchDebounceId);
  }

  searchDebounceId = window.setTimeout(() => {
    searchDebounceId = null;
    fetchLinks(1);
  }, 350);
}

function clearScheduledSearch() {
  if (searchDebounceId === null) return;
  window.clearTimeout(searchDebounceId);
  searchDebounceId = null;
}

function resetFilters() {
  clearScheduledSearch();
  filters.status = SELECT_ALL_VALUE;
  filters.type = SELECT_ALL_VALUE;
  filters.search = "";
  filters.per_page = "25";
  fetchLinks(1);
}

async function fetchLinks(page = 1) {
  clearScheduledSearch();
  isLoading.value = true;

  try {
    const response = await linksService.index({
      page,
      per_page: filters.per_page,
      filter_id: workspaceStore.activeGroupProject?.id || "all",
      ...(workspaceStore.numericProjectId ? { project_id: workspaceStore.numericProjectId } : {}),
      ...(filters.status !== SELECT_ALL_VALUE ? { status: filters.status } : {}),
      ...(filters.type !== SELECT_ALL_VALUE ? { type: filters.type } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    });

    links.value = response.data || [];
    pages.value = {
      current: Number(response.current_page || 1),
      total: Number(response.total || 0),
      last: Number(response.last_page || 0),
    };
  } catch (error) {
    console.error("Erro ao buscar links:", error);
  } finally {
    isLoading.value = false;
  }
}

function updatePerPage(value: string) {
  filters.per_page = value || "25";
  fetchLinks(1);
}
function openEditDialog(linkId: number) {
  editingLinkId.value = linkId;
  isEditDialogOpen.value = true;
}

function openDetails(linkId: number) {
  selectedLinkId.value = linkId;
  isDetailsOpen.value = true;
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

function openArchiveDialog(link: LinkListItem) {
  selectedLinkForArchive.value = link;
  isArchiveDialogOpen.value = true;
}

async function confirmArchive() {
  if (!selectedLinkForArchive.value) {
    return;
  }

  isArchiving.value = true;

  try {
    await linksService.archive(selectedLinkForArchive.value.id);
    toast("Link arquivado com sucesso!");
    isArchiveDialogOpen.value = false;
    selectedLinkForArchive.value = null;
    await fetchLinks(pages.value.current);
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast.error("Acesso negado", { description: error.response?.data?.message || "Você não tem acesso a esse link." });
    }
  } finally {
    isArchiving.value = false;
  }
}

watch(
  () => workspaceStore.activeGroupProject?.id,
  async () => {
    await checkSlug();
    if (hasSlug.value) {
      await fetchLinks(1);
    }
  },
);

onMounted(async () => {
  await checkSlug();
  if (hasSlug.value) {
    await fetchLinks(1);
  }
});

onBeforeUnmount(() => {
  clearScheduledSearch();
});
</script>