<template>
  <div :class="embedded ? 'w-full space-y-6' : 'w-full space-y-6 p-10 pb-16 max-[450px]:p-2'">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div v-if="!embedded">
        <h2 class="text-2xl font-bold tracking-tight">Templates de {{ channelLabel }}</h2>
        <p class="text-muted-foreground">Crie e reutilize conteúdos de {{ channelLabel }} nas campanhas.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2" :class="embedded ? 'ml-auto' : ''">
        <Button variant="outline" :disabled="isLoading" @click="fetchAssets(pages.current)">Atualizar</Button>
        <Button :disabled="!activeProjectId" @click="openCreate">+ Criar Template {{ channelLabel }}</Button>
      </div>
    </div>

    <Card>
      <CardContent class="grid gap-4 pt-6 md:grid-cols-[minmax(220px,0.7fr)_minmax(260px,1.3fr)_auto]">
        <div class="space-y-2">
          <Label>Projeto</Label>
          <Select :model-value="activeProjectId ? String(activeProjectId) : ''" @update:modelValue="selectProject">
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="project in projects" :key="project.id" :value="String(project.id)">
                {{ project.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Busca</Label>
          <Input v-model="search" placeholder="Buscar por nome, assunto ou conteúdo" @keydown.enter="fetchAssets(1)" />
        </div>
        <div class="flex items-end">
          <Button class="w-full" variant="secondary" :disabled="isLoading || !activeProjectId" @click="fetchAssets(1)">Buscar</Button>
        </div>
      </CardContent>
    </Card>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertTitle>Falha ao carregar templates</AlertTitle>
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Card>
      <CardContent class="pt-6">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Pré-visualizar</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead class="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="4" class="py-8 text-center text-muted-foreground">Carregando templates...</TableCell>
              </TableRow>
              <TableRow v-else-if="!activeProjectId">
                <TableCell colspan="4" class="py-8 text-center text-muted-foreground">Selecione um projeto para continuar.</TableCell>
              </TableRow>
              <TableRow v-else-if="assets.length === 0">
                <TableCell colspan="4" class="py-8 text-center text-muted-foreground">
                  Nenhum template de {{ channelLabel }} encontrado.
                </TableCell>
              </TableRow>
              <TableRow v-for="asset in assets" :key="asset.id">
                <TableCell class="min-w-[240px]">
                  <div class="font-medium">{{ asset.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ asset.subject || asset.locale || `#${asset.id}` }}</div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" @click="previewAsset = asset">Visualizar</Button>
                </TableCell>
                <TableCell>{{ formatDateTime(asset.created_at) }}</TableCell>
                <TableCell>
                  <div class="flex justify-end gap-2">
                    <Button v-if="['email', 'sms'].includes(channel)" variant="outline" size="sm" @click="openTest(asset)">Testar envio</Button>
                    <Button variant="outline" size="sm" @click="openEdit(asset)">Editar</Button>
                    <Button variant="destructive" size="sm" @click="openDelete(asset)">Excluir</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <CustomPagination
      v-if="pages.last > 1"
      :select-page="fetchAssets"
      :pages="pages"
      :per_pages="perPage"
      @update:perPages="updatePerPage"
    />

    <MarketingAssetFormDialog
      v-model:open="isFormOpen"
      :channel="channel"
      :project-id="activeProjectId"
      :asset="editingAsset"
      @saved="fetchAssets(pages.current)"
    />

    <Dialog :open="Boolean(previewAsset)" @update:open="previewAsset = $event ? previewAsset : null">
      <DialogContent class="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ previewAsset?.name }}</DialogTitle>
          <DialogDescription>{{ previewAsset?.subject || `Template de ${channelLabel}` }}</DialogDescription>
        </DialogHeader>
        <iframe
          v-if="previewAsset?.channel === 'email'"
          class="h-96 w-full rounded-md border bg-white"
          sandbox=""
          :srcdoc="previewAsset.body"
        />
        <pre v-else class="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm">{{ previewAsset?.body }}</pre>
        <a
          v-if="mediaUrl(previewAsset)"
          :href="mediaUrl(previewAsset) || undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-primary underline"
        >Abrir mídia</a>
      </DialogContent>
    </Dialog>

    <Dialog :open="Boolean(testAsset)" @update:open="closeTest">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Testar envio — {{ testAsset?.name }}</DialogTitle>
          <DialogDescription>Envie o template para um destinatário de teste.</DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Label>{{ testAsset?.channel === 'email' ? 'E-mail do destinatário' : 'Telefone do destinatário' }}</Label>
          <Input
            v-model="testRecipient"
            :type="testAsset?.channel === 'email' ? 'email' : 'tel'"
            :placeholder="testAsset?.channel === 'email' ? 'voce@exemplo.com' : '5511999999999'"
          />
        </div>
        <Alert v-if="testError" variant="destructive"><AlertDescription>{{ testError }}</AlertDescription></Alert>
        <DialogFooter>
          <Button variant="outline" :disabled="isTesting" @click="closeTest(false)">Cancelar</Button>
          <Button :disabled="isTesting || !testRecipient.trim()" @click="sendTest">
            {{ isTesting ? "Enviando..." : "Enviar teste" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="Boolean(deletingAsset)" @update:open="deletingAsset = $event ? deletingAsset : null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir template</AlertDialogTitle>
          <AlertDialogDescription>
            O template <strong>{{ deletingAsset?.name }}</strong> será excluído. O conteúdo já utilizado em campanhas será preservado.
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "vue-sonner";
import { useAvailableProjects } from "@/composables/useAvailableProjects";
import { MARKETING_CHANNEL_LABELS, type MarketingAsset, type MarketingChannel } from "@/contracts/marketingAssets";
import type { WorkspaceFilterItem } from "@/contracts/userProjectGroup";
import {
  deleteMarketingAsset,
  listMarketingAssets,
  sendMarketingAssetTest,
} from "@/services/marketingAssets";
import { useWorkspaceStore } from "@/stores/workspace";
import MarketingAssetFormDialog from "./MarketingAssetFormDialog.vue";

const props = withDefaults(defineProps<{ channel: MarketingChannel; embedded?: boolean }>(), { embedded: false });
const workspaceStore = useWorkspaceStore();
const { projects } = useAvailableProjects();
const assets = ref<MarketingAsset[]>([]);
const search = ref("");
const perPage = ref(10);
const isLoading = ref(false);
const errorMessage = ref("");
const pages = reactive({ current: 1, total: 0, last: 1 });
const isFormOpen = ref(false);
const editingAsset = ref<MarketingAsset | null>(null);
const previewAsset = ref<MarketingAsset | null>(null);
const deletingAsset = ref<MarketingAsset | null>(null);
const isDeleting = ref(false);
const testAsset = ref<MarketingAsset | null>(null);
const testRecipient = ref("");
const testError = ref("");
const isTesting = ref(false);

const channelLabel = computed(() => MARKETING_CHANNEL_LABELS[props.channel]);
const activeProjectId = computed(() => workspaceStore.numericProjectId);

watch(activeProjectId, () => fetchAssets(1), { immediate: true });
onMounted(() => {
  if (!activeProjectId.value && projects.value.length) selectProject(String(projects.value[0].id));
});

async function selectProject(value: unknown) {
  const project = projects.value.find((item) => item.id === Number(value));
  if (!project) return;
  const id = `project_${project.id}`;
  const current = workspaceStore.group_projects.find((item) => item.id === id);
  const workspace: WorkspaceFilterItem = current ?? {
    id,
    project_id: String(project.id),
    is_selected: true,
    label: project.name,
    logo: project.logo,
    name: project.name,
    type: "project",
  };
  await workspaceStore.setActiveGroupProject(workspace);
}

async function fetchAssets(page = 1) {
  if (!activeProjectId.value) {
    assets.value = [];
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await listMarketingAssets({
      project_id: activeProjectId.value,
      channel: props.channel,
      search: search.value.trim() || null,
      sorting: "-created_at",
      page,
      per_page: perPage.value,
    });
    assets.value = response.items;
    pages.current = response.pagination.current_page;
    pages.last = response.pagination.last_page;
    pages.total = response.pagination.total;
  } catch (error: any) {
    assets.value = [];
    errorMessage.value = error?.response?.data?.message || error?.message || "Não foi possível carregar os templates.";
  } finally {
    isLoading.value = false;
  }
}

function updatePerPage(value: string) {
  perPage.value = Number(value) || 10;
  fetchAssets(1);
}

function openCreate() {
  editingAsset.value = null;
  isFormOpen.value = true;
}

function openEdit(asset: MarketingAsset) {
  editingAsset.value = asset;
  isFormOpen.value = true;
}

function openDelete(asset: MarketingAsset) {
  deletingAsset.value = asset;
}

async function confirmDelete() {
  if (!deletingAsset.value) return;
  isDeleting.value = true;
  try {
    await deleteMarketingAsset(deletingAsset.value.id);
    toast.success("Sucesso", { description: "Template excluído com sucesso." });
    const nextPage = assets.value.length === 1 && pages.current > 1 ? pages.current - 1 : pages.current;
    deletingAsset.value = null;
    await fetchAssets(nextPage);
  } catch (error: any) {
    toast.error("Não foi possível excluir", { description: error?.response?.data?.message || error?.message });
  } finally {
    isDeleting.value = false;
  }
}

function openTest(asset: MarketingAsset) {
  testAsset.value = asset;
  testRecipient.value = "";
  testError.value = "";
}

function closeTest(open = true) {
  if (!open) testAsset.value = null;
}

async function sendTest() {
  if (!testAsset.value) return;
  isTesting.value = true;
  testError.value = "";
  try {
    const payload = testAsset.value.channel === "email"
      ? { recipient_email: testRecipient.value.trim() }
      : { recipient_phone: testRecipient.value.trim() };
    const result = await sendMarketingAssetTest(testAsset.value, payload);
    toast.success("Envio de teste solicitado", { description: result.status ? `Status: ${result.status}` : `ID: ${result.message_id}` });
    testAsset.value = null;
  } catch (error: any) {
    testError.value = error?.response?.data?.message || error?.message || "Falha ao enviar o teste.";
  } finally {
    isTesting.value = false;
  }
}

function mediaUrl(asset: MarketingAsset | null): string | null {
  const media = (asset?.payload as any)?.media;
  return typeof media?.url === "string" ? media.url : null;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("pt-BR");
}
</script>
