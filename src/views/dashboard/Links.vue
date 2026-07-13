<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Links</h2>
        <p class="text-muted-foreground">
          Gerencie links, versões de destino, UTM snapshots e arquivamento.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" :disabled="isLoading" @click="fetchLinks(1)">
          Atualizar
        </Button>
        <Button @click="isCreateDialogOpen = true">
          Novo Link
        </Button>
      </div>
    </div>

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
                <SelectItem v-for="option in LINK_STATUS_OPTIONS" :key="option.value" :value="option.value">
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
                <SelectItem v-for="option in LINK_TYPE_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2 xl:col-span-2">
            <Label>Busca</Label>
            <Input
              v-model="filters.search"
              placeholder="Buscar por code ou slug"
              @keydown.enter="fetchLinks(1)"
            />
          </div>
        </div>

        <div class="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" @click="resetFilters()">Limpar filtros</Button>
          <Button :disabled="isLoading" @click="fetchLinks(1)">Buscar</Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="pt-6">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Encurtador</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                  Carregando links...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="links.length === 0">
                <TableCell colspan="7" class="py-8 text-center text-muted-foreground">
                  Nenhum link encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
              <TableRow v-for="link in links" :key="link.id">
                <TableCell class="font-medium">{{ link.code }}</TableCell>
                <TableCell class="font-medium">{{ link.short_url }}</TableCell>

                <TableCell>{{ link.slug || "—" }}</TableCell>
                <TableCell>
                  <Badge variant="outline">{{ link.status || "—" }}</Badge>
                </TableCell>
                <TableCell>{{ link.type || "—" }}</TableCell>
                <TableCell class="max-w-[280px] truncate">{{ getDestinationUrl(link) }}</TableCell>
                <TableCell>
                  <div class="flex justify-end gap-2">
                    <Button variant="outline" size="sm" @click="openDetails(link.id)">Detalhes</Button>
                    <Button variant="outline" size="sm" @click="openEditDialog(link.id)">Editar</Button>
                    <Button variant="destructive" size="sm" @click="openArchiveDialog(link)">Arquivar</Button>
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

    <Sheet :open="isDetailsOpen" @update:open="isDetailsOpen = $event">
      <SheetContent side="right" class="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do link</SheetTitle>
          <SheetDescription>Histórico de versões, destino atual e snapshots de UTM.</SheetDescription>
        </SheetHeader>

        <div v-if="isLoadingDetails" class="py-8 text-center text-muted-foreground">Carregando detalhes...</div>
        <div v-else-if="selectedLinkDetails" class="mt-6 space-y-6">
          <Card>
            <CardContent class="pt-6 space-y-2">
              <div><span class="font-medium">Código:</span> {{ selectedLinkDetails.code }}</div>
              <div><span class="font-medium">Slug:</span> {{ selectedLinkDetails.slug || "—" }}</div>
              <div><span class="font-medium">Status:</span> {{ selectedLinkDetails.status || "—" }}</div>
              <div><span class="font-medium">Tipo:</span> {{ selectedLinkDetails.type || "—" }}</div>
              <div><span class="font-medium">Destino atual:</span> {{ getDestinationUrl(selectedLinkDetails) }}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Última versão</CardTitle></CardHeader>
            <CardContent class="space-y-3">
              <template v-if="selectedLinkDetails.last_version">
                <div class="rounded-lg border p-4 space-y-2">
                  <div class="flex items-center justify-between gap-3">
                    <Badge variant="outline">Versão {{ selectedLinkDetails.last_version.id || "—" }}</Badge>
                    <span class="text-xs text-muted-foreground">{{ selectedLinkDetails.last_version.created_at || "Sem data" }}</span>
                  </div>
                  <div v-for="dest in selectedLinkDetails.last_version.destinations" :key="dest.id" class="border-t pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                    <div class="text-sm"><span class="font-medium">URL:</span> {{ dest.url || "—" }}</div>
                    <div class="text-sm"><span class="font-medium">Peso:</span> {{ dest.weight ?? "—" }}</div>
                    <div class="text-sm"><span class="font-medium">Status:</span> {{ dest.status || "—" }}</div>
                  </div>
                </div>
              </template>
              <div v-else class="text-sm text-muted-foreground">Nenhuma versão retornada.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>UTM Snapshots</CardTitle></CardHeader>
            <CardContent class="space-y-3">
              <div v-if="snapshots.length === 0" class="text-sm text-muted-foreground">Nenhum snapshot retornado.</div>
              <div v-for="snapshot in snapshots" :key="snapshot.id || snapshot.snapshot_at || JSON.stringify(snapshot)" class="rounded-lg border p-4 space-y-1">
                <div class="text-sm"><span class="font-medium">UTM Source:</span> {{ snapshot.utm_source || "—" }}</div>
                <div class="text-sm"><span class="font-medium">UTM Medium:</span> {{ snapshot.utm_medium || "—" }}</div>
                <div class="text-sm"><span class="font-medium">UTM Campaign:</span> {{ snapshot.utm_campaign || "—" }}</div>
                <div class="text-sm"><span class="font-medium">UTM Content:</span> {{ snapshot.utm_content || "—" }}</div>
                <div class="text-sm"><span class="font-medium">UTM Term:</span> {{ snapshot.utm_term || "—" }}</div>
                <div class="text-sm pt-1 border-t" v-if="snapshot.context">
                  <span class="font-medium">Channel:</span> {{ snapshot.context.channel || "—" }}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>

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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { toast } from "@/components/ui/toast";
import linksService from "@/services/links";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import CreateDialogComponent from "@/components/links/CreateDialogComponent.vue";
import EditDialogComponent from "@/components/links/EditDialogComponent.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LinkDetailsResponse, LinkListItem } from "@/contracts/link";
import {
  LINK_STATUS_OPTIONS,
  LINK_TYPE_OPTIONS,
} from "@/contracts/link";
import { getDestinationUrl, SELECT_ALL_VALUE } from "@/components/links/linkForm";

const workspaceStore = useWorkspaceStore();
const links = ref<LinkListItem[]>([]);
const isLoading = ref(false);
const isLoadingDetails = ref(false);
const isArchiving = ref(false);
const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDetailsOpen = ref(false);
const isArchiveDialogOpen = ref(false);
const selectedLinkDetails = ref<LinkDetailsResponse | null>(null);
const selectedLinkForArchive = ref<LinkListItem | null>(null);

const snapshots = computed(() => [
  ...(selectedLinkDetails.value?.utmSnapshots ?? []),
  ...(selectedLinkDetails.value?.utm_snapshots ?? []),
]);
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

function resetFilters() {
  filters.status = SELECT_ALL_VALUE;
  filters.type = SELECT_ALL_VALUE;
  filters.search = "";
  filters.per_page = "25";
  fetchLinks(1);
}

async function fetchLinks(page = 1) {
  isLoading.value = true;

  try {
    const response = await linksService.index({
      page,
      per_page: filters.per_page,
      filter_id: workspaceStore.activeGroupProject?.id || "all",
      project_id: workspaceStore.activeGroupProject?.project_id || workspaceStore.activeGroupProject?.id,
      ...(filters.status !== SELECT_ALL_VALUE ? { status: filters.status } : {}),
      ...(filters.type !== SELECT_ALL_VALUE ? { type: filters.type } : {}),
      ...(filters.search ? { search: filters.search } : {}),
    });

    links.value = response.data || [];
    pages.value = {
      current: Number(response.meta?.current_page || 1),
      total: Number(response.meta?.total || 0),
      last: Number(response.meta?.last_page || 0),
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

async function openDetails(linkId: number) {
  isDetailsOpen.value = true;
  isLoadingDetails.value = true;

  try {
    selectedLinkDetails.value = await linksService.show(linkId);
  } catch (error) {
    console.error("Erro ao carregar detalhes do link:", error);
    isDetailsOpen.value = false;
  } finally {
    isLoadingDetails.value = false;
  }
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
    toast({ title: "Link arquivado com sucesso!" });
    isArchiveDialogOpen.value = false;
    selectedLinkForArchive.value = null;
    await fetchLinks(pages.value.current);
  } catch (error: any) {
    if (error?.response?.status === 403) {
      toast({
        title: "Acesso negado",
        description: error.response?.data?.message || "Você não tem acesso a esse link.",
        variant: "destructive",
      });
    }
  } finally {
    isArchiving.value = false;
  }
}

watch(
  () => workspaceStore.activeGroupProject?.id,
  () => {
    fetchLinks(1);
  },
);

onMounted(async () => {
  await fetchLinks(1);
});
</script>