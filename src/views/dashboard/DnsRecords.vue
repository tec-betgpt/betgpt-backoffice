<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Registros de DNS</h2>
      <p class="text-muted-foreground">
        Gerencie os registros DNS do domínio usando a integração com a
        Cloudflare do projeto.
      </p>
    </div>

    <div v-if="isGroupWorkspace" class="rounded-md border p-6 text-sm">
      Para gerenciar registros DNS é necessário que a workspace seja um
      projeto.
    </div>

    <template v-else>
      <Card class="p-5 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Server class="h-5 w-5 text-muted-foreground" />
              <p class="font-medium">Zona gerenciada na Cloudflare</p>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <template v-if="cloudflareConnected">
                <ShieldCheck class="h-4 w-4 text-emerald-600" />
                <span class="text-emerald-700 dark:text-emerald-400">
                  Cloudflare conectada
                </span>
              </template>
              <template v-else>
                <ShieldAlert class="h-4 w-4 text-amber-600" />
                <span class="text-amber-700 dark:text-amber-400">
                  Cloudflare não conectada
                </span>
              </template>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Select
              v-if="cloudflareConnected && zones.length"
              :model-value="selectedZoneId"
              @update:model-value="(value) => onZoneChange(String(value))"
            >
              <SelectTrigger class="w-[280px]">
                <SelectValue placeholder="Selecione a zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="zone in zones"
                  :key="zone.id"
                  :value="zone.id"
                >
                  {{ zone.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              :disabled="!cloudflareConnected || loadingRecords"
              @click="reload"
            >
              <RefreshCw
                :class="cn('mr-2 h-4 w-4', loadingRecords && 'animate-spin')"
              />
              Recarregar
            </Button>
            <Button
              :disabled="!cloudflareConnected || !selectedZoneId"
              @click="openCreateDialog"
            >
              <Plus class="mr-2 h-4 w-4" /> Novo registro
            </Button>
          </div>
        </div>

        <div
          v-if="!cloudflareConnected"
          class="space-y-4 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div class="space-y-2">
              <p class="font-medium">
                Cloudflare não conectada — configuração manual
              </p>
              <p>
                Para gerenciar os registros por aqui, conecte a Cloudflare em
                Fontes de Dados. Sem a conexão, crie os registros no painel do
                seu provedor de DNS:
              </p>
              <ul class="list-disc space-y-1 pl-5">
                <li>
                  <strong>A</strong> — nome <code class="font-mono">@</code>
                  (domínio raiz) ou <code class="font-mono">www</code>,
                  apontando para o IP de
                  <code class="font-mono">{{ linkTargetHost }}</code>.
                </li>
                <li>
                  Mantenha o proxy (nuvem laranja) desligado e o TTL automático.
                </li>
                <li>
                  Depois de criar, aguarde a propagação e volte a esta tela
                  para acompanhar a verificação.
                </li>
              </ul>
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <code
                  class="rounded bg-amber-100 px-2 py-1 font-mono text-xs dark:bg-amber-500/20"
                >
                  {{ linkTargetHost }}
                </code>
                <Button variant="outline" size="sm" @click="copyTargetHost">
                  <Check v-if="copiedTarget" class="mr-2 h-4 w-4" />
                  <Copy v-else class="mr-2 h-4 w-4" />
                  {{ copiedTarget ? "Copiado" : "Copiar host" }}
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" @click="goToDataSources">
              Ir para Fontes de Dados
              <ExternalLink class="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          v-else-if="zonesLoaded && !zones.length"
          class="rounded-lg border p-4 text-sm text-muted-foreground"
        >
          Nenhuma zona autorizada foi encontrada para esta conta da Cloudflare.
          Verifique se o consentimento inclui acesso às zonas do domínio.
        </div>
      </Card>

      <div
        class="rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        <ul class="list-disc space-y-1 pl-5">
          <li>
            Neste espaço, você pode gerenciar todos os registros DNS do domínio
            — adicionar, editar ou remover conforme necessário.
          </li>
          <li>
            Atenção: faça alterações apenas se tiver conhecimento técnico, pois
            configurações incorretas podem afetar o funcionamento do site e dos
            e-mails.
          </li>
          <li>
            Dica: evite excluir registros essenciais (e-mail, hospedagem,
            segurança, SSL, Cloudflare etc.).
          </li>
          <li>
            Tipos liberados para edição: A, AAAA, CNAME e TXT. Registros NS, SOA,
            MX e SRV aparecem na lista, mas não podem ser alterados por aqui.
          </li>
        </ul>
      </div>

      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-lg font-semibold">Gerenciamento de DNS</h3>
          <p v-if="cloudflareConnected && selectedZone" class="text-sm text-muted-foreground">
            {{ selectedZone.name }}
            <span v-if="meta.total">— {{ meta.total }} registros</span>
          </p>
        </div>

        <div class="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[90px]">Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Conteúdo</TableHead>
                <TableHead class="w-[80px]">TTL</TableHead>
                <TableHead class="w-[80px]">Proxy</TableHead>
                <TableHead class="w-[110px]">Prioridade</TableHead>
                <TableHead
                  v-if="canManageRecords"
                  class="w-[90px] text-right"
                >
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loadingRecords">
                <TableCell :colspan="columnCount" class="h-24 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <Spinner class="h-4 w-4" />
                    Carregando registros...
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="!records.length">
                <TableCell :colspan="columnCount" class="h-24 text-center">
                  {{
                    cloudflareConnected
                      ? "Nenhum registro encontrado nesta zona."
                      : "Conecte a Cloudflare para visualizar os registros."
                  }}
                </TableCell>
              </TableRow>
              <TableRow v-for="record in records" :key="record.id">
                <TableCell>
                  <Badge variant="outline" class="font-mono">
                    {{ record.type }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="max-w-[260px] truncate font-mono text-xs"
                  :title="record.name"
                >
                  {{ record.name }}
                </TableCell>
                <TableCell
                  class="max-w-[320px] truncate font-mono text-xs"
                  :title="record.content"
                >
                  {{ record.content }}
                </TableCell>
                <TableCell class="text-sm">
                  {{ record.ttl === 1 ? "Automático" : record.ttl }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="record.proxied ? 'default' : 'secondary'"
                    class="text-xs"
                  >
                    {{ record.proxied ? "Sim" : "Não" }}
                  </Badge>
                </TableCell>
                <TableCell class="text-sm">
                  {{ record.priority ?? "—" }}
                </TableCell>
                <TableCell
                  v-if="canManageRecords"
                  class="text-right whitespace-nowrap"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :disabled="!isWritable(record)"
                    :title="
                      isWritable(record)
                        ? 'Editar registro'
                        : 'Tipo não editável por aqui'
                    "
                    @click="openEditDialog(record)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    :disabled="!isWritable(record)"
                    :title="
                      isWritable(record)
                        ? 'Remover registro'
                        : 'Tipo não editável por aqui'
                    "
                    @click="confirmDelete(record)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <CustomPagination
          v-if="cloudflareConnected && pages.last > 1"
          :select-page="fetchRecords"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="onPerPageChange"
        />
      </div>
    </template>

    <Dialog v-model:open="isFormDialogOpen">
      <DialogContent class="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {{ editingRecord ? "Editar registro" : "Novo registro" }}
          </DialogTitle>
          <DialogDescription>
            {{
              selectedZone
                ? `Registro na zona ${selectedZone.name}.`
                : "Informe os dados do registro."
            }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="dns-record-type">Tipo</Label>
            <Select v-model="form.type" :disabled="formSaving">
              <SelectTrigger id="dns-record-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="type in RECORD_TYPES"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="dns-record-name">Nome</Label>
            <Input
              id="dns-record-name"
              v-model="form.name"
              :disabled="formSaving"
              :placeholder="namePlaceholder"
            />
            <p class="text-xs text-muted-foreground">
              Use <code class="font-mono">@</code> para o domínio raiz ou apenas
              o rótulo (ex.: <code class="font-mono">www</code>) para completar
              com {{ selectedZone?.name ?? "a zona" }}.
            </p>
          </div>

          <div class="space-y-2">
            <Label for="dns-record-content">Conteúdo</Label>
            <Input
              id="dns-record-content"
              v-model="form.content"
              :disabled="formSaving"
              placeholder="Ex.: 203.0.113.10, cliente.com ou v=DMARC1;p=none;"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="dns-record-ttl">TTL</Label>
              <Input
                id="dns-record-ttl"
                v-model.number="form.ttl"
                type="number"
                min="1"
                max="86400"
                :disabled="formSaving"
                placeholder="1 (automático)"
              />
            </div>

            <div class="space-y-2">
              <Label>Proxy</Label>
              <div class="flex h-10 items-center gap-2">
                <Switch
                  :model-value="form.proxied"
                  :disabled="formSaving || !isProxiableRecordType(form.type)"
                  @update:model-value="form.proxied = $event"
                />
                <span class="text-sm text-muted-foreground">
                  {{
                    isProxiableRecordType(form.type)
                      ? "Nuvem laranja"
                      : "Indisponível para este tipo"
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            :disabled="formSaving"
            @click="isFormDialogOpen = false"
          >
            Cancelar
          </Button>
          <Button :disabled="formSaving || !canSubmitForm" @click="saveRecord">
            <Spinner v-if="formSaving" class="mr-2 h-4 w-4" />
            {{ formSaving ? "Salvando..." : "Salvar registro" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog
      :open="isDeleteDialogOpen"
      @update:open="isDeleteDialogOpen = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover registro DNS?</AlertDialogTitle>
          <AlertDialogDescription>
            O registro
            <strong>{{ recordToDelete?.type }}</strong>
            <strong class="font-mono">{{ recordToDelete?.name }}</strong> será
            removido da Cloudflare. Esta ação não pode ser desfeita e pode
            interromper o funcionamento do site ou dos e-mails.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deleting"
            @click="deleteRecord"
          >
            <Spinner v-if="deleting" class="mr-2 h-4 w-4" />
            {{ deleting ? "Removendo..." : "Remover" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import {
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import { usePagination } from "@/composables/usePagination";
import { isOAuthConnected } from "@/lib/integrationConnection";
import {
  isProxiableRecordType,
  normalizeRecordName,
  RECORD_TYPES,
} from "@/lib/dnsRecord";
import CloudflareDnsService from "@/services/cloudflareDns";
import LinkDomainsService from "@/services/linkDomains";
import Projects from "@/services/projects";
import type { DnsRecord, DnsZone } from "@/contracts/dnsRecord";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import CustomPagination from "@/components/custom/CustomPagination.vue";

const workspaceStore = useWorkspaceStore();
const router = useRouter();

const projectId = computed(() =>
  Number(workspaceStore.activeGroupProject?.project_id ?? 0),
);
const isGroupWorkspace = computed(
  () => workspaceStore.activeGroupProject?.type === "group",
);
const canManageRecords = computed(() => !isGroupWorkspace.value);

const linkTargetHost = computed(
  () =>
    (import.meta.env.VITE_PUBLIC_SHORT_LINK_HOST as string | undefined) ||
    "le.myelevate.ai",
);
const copiedTarget = ref(false);

const cloudflareConnected = ref(false);
const cloudflareIntegrationId = ref<number | null>(null);
const zones = ref<DnsZone[]>([]);
const zonesLoaded = ref(false);
const selectedZoneId = ref("");
const records = ref<DnsRecord[]>([]);
const loadingRecords = ref(false);
const perPage = ref(10);
const { pages, updateFromResponse } = usePagination();

const selectedZone = computed(
  () => zones.value.find((zone) => zone.id === selectedZoneId.value) ?? null,
);

const meta = ref({ total: 0 });

const isFormDialogOpen = ref(false);
const editingRecord = ref<DnsRecord | null>(null);
const formSaving = ref(false);
const form = ref({
  type: "A",
  name: "",
  content: "",
  ttl: 1,
  proxied: false,
});

const isDeleteDialogOpen = ref(false);
const recordToDelete = ref<DnsRecord | null>(null);
const deleting = ref(false);

const columnCount = computed(() => (canManageRecords.value ? 7 : 6));

const namePlaceholder = computed(() =>
  selectedZone.value ? `www ou @ (${selectedZone.value.name})` : "www",
);

const canSubmitForm = computed(
  () =>
    form.value.type.trim() !== "" &&
    form.value.name.trim() !== "" &&
    form.value.content.trim() !== "",
);

function isWritable(record: DnsRecord) {
  return RECORD_TYPES.some((type) => type.value === record.type);
}

function goToDataSources() {
  router.push({ name: "data-sources" });
}

async function copyTargetHost() {
  try {
    await navigator.clipboard.writeText(linkTargetHost.value);
    copiedTarget.value = true;
    setTimeout(() => (copiedTarget.value = false), 2000);
  } catch {
    // Clipboard indisponível: o host continua visível na tela.
  }
}

function onZoneChange(zoneId: string) {
  if (!zoneId || zoneId === selectedZoneId.value) return;

  selectedZoneId.value = zoneId;
  pages.value.current = 1;
  void fetchRecords(1);
}

function onPerPageChange(value: number | string) {
  const parsed = Number(value);

  if (!parsed || parsed === perPage.value) return;

  perPage.value = parsed;
  void fetchRecords(1);
}

async function fetchRecords(current = pages.value.current) {
  if (!cloudflareConnected.value || !selectedZoneId.value || !projectId.value) {
    records.value = [];
    return;
  }

  loadingRecords.value = true;

  try {
    const result = await CloudflareDnsService.index(projectId.value, selectedZoneId.value, {
      page: current,
      per_page: perPage.value,
    });

    records.value = result.records ?? [];
    meta.value = { total: result.meta?.total ?? 0 };
    updateFromResponse({
      current_page: result.meta?.page ?? current,
      total: result.meta?.total ?? 0,
      last_page: result.meta?.total_pages ?? 1,
    });
  } catch {
    records.value = [];
    updateFromResponse({ current_page: 1, total: 0, last_page: 1 });
    toast.error("Erro", {
      description: "Não foi possível carregar os registros DNS.",
    });
  } finally {
    loadingRecords.value = false;
  }
}

async function reload() {
  await fetchRecords(pages.value.current);
}

async function loadZones() {
  zonesLoaded.value = false;

  try {
    const list = await CloudflareDnsService.zones({
      project_id: projectId.value,
      integration_id: cloudflareIntegrationId.value as number,
    });

    zones.value = Array.isArray(list) ? list : [];

    if (zones.value.length) {
      selectedZoneId.value = await pickDefaultZone(zones.value);
      await fetchRecords(1);
    }
  } catch {
    zones.value = [];
    toast.error("Erro", {
      description: "Não foi possível carregar as zonas da Cloudflare.",
    });
  } finally {
    zonesLoaded.value = true;
  }
}

async function pickDefaultZone(list: DnsZone[]): Promise<string> {
  try {
    const domains = await LinkDomainsService.index(projectId.value);

    for (const domain of domains) {
      const match = list
        .filter(
          (zone) =>
            domain.domain === zone.name ||
            domain.domain.endsWith(`.${zone.name}`),
        )
        .sort((a, b) => b.name.length - a.name.length)[0];

      if (match) {
        return match.id;
      }
    }
  } catch {
    // Sem domínios cadastrados: usa a primeira zona disponível.
  }

  return list[0]?.id ?? "";
}

async function loadCloudflareConnection() {
  try {
    const response = await Projects.integrations(projectId.value);
    const list = Array.isArray(response?.data) ? response.data : [];
    const cloudflare = list.find(
      (integration: any) => integration.slug === "cloudflare",
    );

    cloudflareIntegrationId.value = cloudflare?.id ?? null;
    cloudflareConnected.value = isOAuthConnected({
      config: cloudflare?.integration?.config ?? cloudflare?.config,
    });

    if (cloudflareConnected.value && cloudflareIntegrationId.value) {
      await loadZones();
    }
  } catch {
    cloudflareConnected.value = false;
    toast.error("Erro", {
      description: "Não foi possível verificar a conexão com a Cloudflare.",
    });
  }
}

function openCreateDialog() {
  editingRecord.value = null;
  form.value = {
    type: "A",
    name: "",
    content: "",
    ttl: 1,
    proxied: false,
  };
  isFormDialogOpen.value = true;
}

function openEditDialog(record: DnsRecord) {
  editingRecord.value = record;
  form.value = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
  };
  isFormDialogOpen.value = true;
}

async function saveRecord() {
  if (!selectedZone.value || !projectId.value) return;

  const name = normalizeRecordName(form.value.name, selectedZone.value.name);

  if (!name) {
    toast.error("Nome inválido", {
      description: `O registro precisa pertencer à zona ${selectedZone.value.name}.`,
    });
    return;
  }

  const payload = {
    type: form.value.type,
    name,
    content: form.value.content.trim(),
    ttl: form.value.ttl && form.value.ttl > 0 ? form.value.ttl : 1,
    proxied: isProxiableRecordType(form.value.type) && form.value.proxied,
  };

  formSaving.value = true;

  try {
    if (editingRecord.value) {
      await CloudflareDnsService.update(
        projectId.value,
        selectedZoneId.value,
        editingRecord.value.id,
        payload,
      );
      toast("Sucesso", { description: "Registro atualizado com sucesso." });
    } else {
      await CloudflareDnsService.store(
        projectId.value,
        selectedZoneId.value,
        payload,
      );
      toast("Sucesso", { description: "Registro criado com sucesso." });
    }

    isFormDialogOpen.value = false;
    await fetchRecords(editingRecord.value ? pages.value.current : 1);
  } catch (error: any) {
    toast.error("Erro", {
      description:
        error?.response?.data?.message ||
        "Não foi possível salvar o registro DNS.",
    });
  } finally {
    formSaving.value = false;
  }
}

function confirmDelete(record: DnsRecord) {
  recordToDelete.value = record;
  isDeleteDialogOpen.value = true;
}

async function deleteRecord() {
  if (!recordToDelete.value) return;

  deleting.value = true;

  try {
    await CloudflareDnsService.destroy(
      projectId.value,
      selectedZoneId.value,
      recordToDelete.value.id,
    );
    toast("Sucesso", { description: "Registro removido com sucesso." });
    isDeleteDialogOpen.value = false;
    recordToDelete.value = null;
    await fetchRecords(pages.value.current);
  } catch (error: any) {
    toast.error("Erro", {
      description:
        error?.response?.data?.message ||
        "Não foi possível remover o registro DNS.",
    });
  } finally {
    deleting.value = false;
  }
}

onMounted(async () => {
  if (isGroupWorkspace.value) return;

  await loadCloudflareConnection();
});

useScreenContext(
  "Tela de registros DNS - Gerencia os registros de uma zona da Cloudflare",
  () => ({
    "project_id": workspaceStore.activeGroupProject?.project_id ?? "",
    "project_name": workspaceStore.activeGroupProject?.name ?? "",
    "cloudflare_connected": cloudflareConnected.value ? "Sim" : "Não",
    "zone": selectedZone.value?.name ?? "Não selecionada",
    "records_count": meta.value.total,
  }),
  "/v1/projects/:project_id/integrations/cloudflare/zones/:zone_id/dns-records",
);
</script>
