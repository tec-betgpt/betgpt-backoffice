<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import moment from "moment";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EndpointFormDialog from "@/components/webhook-inspector/EndpointFormDialog.vue";
import RequestDetail from "@/components/webhook-inspector/RequestDetail.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { formatBytes, methodClass } from "@/components/webhook-inspector/format";
import webhookInspector, {
  type WebhookInspectorEndpoint,
  type WebhookInspectorEndpointPayload,
  type WebhookInspectorRequestDetail,
  type WebhookInspectorRequestSummary,
} from "@/services/webhookInspector";
import { ArrowLeftIcon, CopyIcon, InboxIcon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-vue-next";

const POLL_INTERVAL_MS = 3000;
const PAGE_SIZE = 50;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];

const route = useRoute();
const router = useRouter();
const uuid = computed(() => String(route.params.uuid));
const workspaceStore = useWorkspaceStore();
const projectId = computed(() => workspaceStore.numericProjectId);

const endpoint = ref<WebhookInspectorEndpoint | null>(null);
const notFound = ref(false);
const requests = ref<WebhookInspectorRequestSummary[]>([]);
const total = ref(0);
const hasMore = ref(false);
const loadingList = ref(true);
const loadingMore = ref(false);

const search = ref("");
const appliedSearch = ref("");
const method = ref("all");
const live = ref(true);

const selectedUuid = ref<string | null>(null);
const selected = ref<WebhookInspectorRequestDetail | null>(null);
const loadingDetail = ref(false);
const details = new Map<string, WebhookInspectorRequestDetail>();

const formOpen = ref(false);
const submitting = ref(false);
const clearOpen = ref(false);
const clearing = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;
let polling = false;
let searchDebounce: ReturnType<typeof setTimeout> | null = null;

const filters = computed(() => ({
  method: method.value === "all" ? undefined : method.value,
  search: appliedSearch.value || undefined,
}));

const curlExample = computed(() =>
  endpoint.value
    ? `curl -X POST '${endpoint.value.url}?origem=teste' -H 'Content-Type: application/json' -d '{"evento":"teste","valor":10}'`
    : "",
);

async function loadEndpoint() {
  try {
    endpoint.value = await webhookInspector.getEndpoint(projectId.value!, uuid.value);
  } catch (error: any) {
    // Também cai aqui ao trocar de projeto com o endpoint aberto: ele é de outro projeto.
    if (error?.response?.status === 404) {
      notFound.value = true;
      router.replace({ name: "webhook-inspector" });
    }
  }
}

async function loadRequests() {
  loadingList.value = true;
  try {
    const page = await webhookInspector.listRequests(projectId.value!, uuid.value, { ...filters.value, limit: PAGE_SIZE });
    requests.value = page.items;
    hasMore.value = page.has_more;
    total.value = page.total;
    if (!requests.value.some((item) => item.uuid === selectedUuid.value)) {
      select(requests.value[0]?.uuid ?? null);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingList.value = false;
  }
}

async function loadOlder() {
  const oldest = requests.value[requests.value.length - 1];
  if (!oldest) return;
  loadingMore.value = true;
  try {
    const page = await webhookInspector.listRequests(projectId.value!, uuid.value, {
      ...filters.value,
      before_id: oldest.id,
      limit: PAGE_SIZE,
    });
    requests.value.push(...page.items);
    hasMore.value = page.has_more;
  } finally {
    loadingMore.value = false;
  }
}

async function poll() {
  if (polling || !live.value || !projectId.value || loadingList.value || document.visibilityState !== "visible") return;
  polling = true;
  try {
    const newest = requests.value[0];
    const page = await webhookInspector.listRequests(projectId.value!, uuid.value, {
      ...filters.value,
      after_id: newest?.id ?? 0,
      limit: PAGE_SIZE,
    });
    total.value = page.total;
    if (page.items.length === 0) return;

    // Quem estava olhando a mais recente continua acompanhando as novas.
    const following = selectedUuid.value === null || selectedUuid.value === newest?.uuid;
    requests.value = [...page.items, ...requests.value];
    if (following) select(page.items[0].uuid);
  } catch (error) {
    console.error(error);
  } finally {
    polling = false;
  }
}

async function select(requestUuid: string | null) {
  selectedUuid.value = requestUuid;
  if (!requestUuid) {
    selected.value = null;
    return;
  }
  const cached = details.get(requestUuid);
  if (cached) {
    selected.value = cached;
    return;
  }
  loadingDetail.value = true;
  try {
    const detail = await webhookInspector.getRequest(projectId.value!, uuid.value, requestUuid);
    details.set(requestUuid, detail);
    if (selectedUuid.value === requestUuid) selected.value = detail;
  } catch (error) {
    console.error(error);
  } finally {
    loadingDetail.value = false;
  }
}

async function deleteSelected() {
  const target = selectedUuid.value;
  if (!target) return;
  try {
    await webhookInspector.deleteRequest(projectId.value!, uuid.value, target);
    const index = requests.value.findIndex((item) => item.uuid === target);
    requests.value = requests.value.filter((item) => item.uuid !== target);
    details.delete(target);
    total.value = Math.max(0, total.value - 1);
    select(requests.value[Math.min(index, requests.value.length - 1)]?.uuid ?? null);
    toast("Requisição excluída");
  } catch (error) {
    console.error(error);
  }
}

async function confirmClear() {
  clearing.value = true;
  try {
    const deleted = await webhookInspector.clearRequests(projectId.value!, uuid.value);
    requests.value = [];
    details.clear();
    total.value = 0;
    hasMore.value = false;
    select(null);
    clearOpen.value = false;
    toast(`${deleted} requisição(ões) excluída(s)`);
  } catch (error) {
    console.error(error);
  } finally {
    clearing.value = false;
  }
}

async function handleSubmit(payload: WebhookInspectorEndpointPayload) {
  submitting.value = true;
  try {
    endpoint.value = await webhookInspector.updateEndpoint(projectId.value!, uuid.value, payload);
    formOpen.value = false;
    toast("Endpoint atualizado");
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`);
  } catch {
    toast.error("Não foi possível copiar");
  }
}

function preview(item: WebhookInspectorRequestSummary) {
  const parts = [item.path, item.query_string ? `?${item.query_string}` : null].filter(Boolean);
  return parts.length ? parts.join("") : "/";
}

watch(search, (value) => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    appliedSearch.value = value.trim();
  }, 400);
});

watch(filters, () => loadRequests());

// O endpoint é de um projeto; trocar de projeto no workspace volta para a lista.
watch(projectId, (next, previous) => {
  if (previous && next !== previous) router.push({ name: "webhook-inspector" });
});

onMounted(async () => {
  if (!projectId.value) {
    router.replace({ name: "webhook-inspector" });
    return;
  }
  await loadEndpoint();
  if (notFound.value) return;
  await loadRequests();
  timer = setInterval(poll, POLL_INTERVAL_MS);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  if (searchDebounce) clearTimeout(searchDebounce);
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div v-if="notFound" class="border rounded-lg p-10 text-center space-y-3">
      <p class="font-medium">Endpoint não encontrado</p>
      <p class="text-sm text-muted-foreground">Ele pode ter sido excluído.</p>
      <Button variant="outline" @click="router.push({ name: 'webhook-inspector' })">Voltar para a lista</Button>
    </div>

    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Voltar" @click="router.push({ name: 'webhook-inspector' })">
              <ArrowLeftIcon class="size-4" />
            </Button>
            <Skeleton v-if="!endpoint" class="h-7 w-56" />
            <template v-else>
              <h2 class="text-2xl font-bold tracking-tight truncate">{{ endpoint.name }}</h2>
              <Badge :variant="endpoint.is_active ? 'default' : 'secondary'">
                {{ endpoint.is_active ? "Ativo" : "Pausado" }}
              </Badge>
            </template>
          </div>
          <div v-if="endpoint" class="flex items-center gap-1 pl-11">
            <code class="text-sm bg-muted rounded px-2 py-1 break-all">{{ endpoint.url }}</code>
            <Button variant="ghost" size="icon" class="size-8 shrink-0" title="Copiar URL" @click="copy(endpoint.url, 'URL')">
              <CopyIcon class="size-4" />
            </Button>
          </div>
          <p v-if="endpoint?.description" class="text-sm text-muted-foreground pl-11">{{ endpoint.description }}</p>
          <p v-if="endpoint" class="text-xs text-muted-foreground pl-11">
            Responde {{ endpoint.response_status }} ({{ endpoint.response_content_type }}). Aceita qualquer método
            e qualquer caminho depois da URL.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-sm mr-2" title="Buscar novas requisições a cada 3 segundos">
            <Switch v-model:checked="live" />
            <span class="flex items-center gap-1.5">
              <span :class="['size-2 rounded-full', live ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground']" />
              Ao vivo
            </span>
          </label>
          <Button variant="outline" :disabled="!endpoint" @click="formOpen = true">
            <PencilIcon class="size-4 mr-2" /> Editar
          </Button>
          <Button variant="outline" class="text-destructive" :disabled="total === 0" @click="clearOpen = true">
            <Trash2Icon class="size-4 mr-2" /> Limpar
          </Button>
        </div>
      </div>

      <div
        v-if="endpoint && !endpoint.is_active"
        class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
      >
        Endpoint pausado: a URL responde 410 e não guarda nada até ser reativado.
      </div>

      <div class="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside class="border rounded-lg flex flex-col min-h-[400px] lg:h-[calc(100vh-260px)]">
          <div class="p-3 border-b space-y-2">
            <div class="relative">
              <SearchIcon class="size-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input v-model="search" class="pl-8" placeholder="Buscar no corpo, query, caminho ou IP" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Select v-model="method">
                <SelectTrigger class="w-36 h-8">
                  <SelectValue placeholder="Método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem v-for="item in METHODS" :key="item" :value="item">{{ item }}</SelectItem>
                </SelectContent>
              </Select>
              <span class="text-xs text-muted-foreground">{{ total }} no total</span>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="loadingList" class="p-3 space-y-2">
              <Skeleton v-for="i in 6" :key="i" class="h-12 w-full" />
            </div>
            <div v-else-if="requests.length === 0" class="p-6 text-center text-sm text-muted-foreground space-y-2">
              <InboxIcon class="size-6 mx-auto" />
              <p v-if="filters.method || filters.search">Nada encontrado com esses filtros.</p>
              <p v-else>Aguardando a primeira requisição...</p>
            </div>
            <template v-else>
              <button
                v-for="item in requests"
                :key="item.uuid"
                type="button"
                :class="[
                  'w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-muted/60 transition-colors',
                  item.uuid === selectedUuid ? 'bg-muted' : '',
                ]"
                @click="select(item.uuid)"
              >
                <div class="flex items-center gap-2">
                  <span :class="['rounded px-1.5 py-0.5 text-[10px] font-bold w-14 text-center', methodClass(item.method)]">
                    {{ item.method }}
                  </span>
                  <span class="text-xs tabular-nums">{{ moment(item.created_at).format("DD/MM HH:mm:ss") }}</span>
                  <span class="text-[11px] text-muted-foreground ml-auto">{{ formatBytes(item.size) }}</span>
                </div>
                <p class="text-xs font-mono text-muted-foreground truncate mt-1">{{ preview(item) }}</p>
                <p class="text-[11px] text-muted-foreground font-mono">{{ item.ip ?? "—" }}</p>
              </button>
              <div v-if="hasMore" class="p-3">
                <Button variant="outline" size="sm" class="w-full" :disabled="loadingMore" @click="loadOlder">
                  {{ loadingMore ? "Carregando..." : "Carregar mais antigas" }}
                </Button>
              </div>
            </template>
          </div>
        </aside>

        <main class="border rounded-lg p-4 min-h-[400px] lg:h-[calc(100vh-260px)] overflow-y-auto">
          <div v-if="loadingDetail && !selected" class="space-y-3">
            <Skeleton class="h-6 w-2/3" />
            <Skeleton class="h-24 w-full" />
            <Skeleton class="h-48 w-full" />
          </div>
          <RequestDetail v-else-if="selected" :request="selected" @delete="deleteSelected" />
          <div v-else class="h-full flex flex-col items-center justify-center text-center gap-3 p-6">
            <p class="font-medium">Nenhuma requisição selecionada</p>
            <p class="text-sm text-muted-foreground max-w-lg">
              Use a URL acima como postback ou webhook. As requisições aparecem aqui sozinhas. Para testar agora:
            </p>
            <div v-if="endpoint" class="flex items-start gap-1 max-w-full">
              <code class="text-xs bg-muted rounded px-2 py-1.5 text-left break-all">{{ curlExample }}</code>
              <Button variant="ghost" size="icon" class="size-7 shrink-0" title="Copiar comando" @click="copy(curlExample, 'Comando')">
                <CopyIcon class="size-3.5" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </template>

    <EndpointFormDialog
      :open="formOpen"
      :initial="endpoint"
      :submitting="submitting"
      @update:open="formOpen = $event"
      @submit="handleSubmit"
    />

    <AlertDialog :open="clearOpen" @update:open="!$event && !clearing && (clearOpen = false)">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar requisições?</AlertDialogTitle>
          <AlertDialogDescription>
            As {{ total }} requisições guardadas neste endpoint serão apagadas. A URL continua
            funcionando.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="clearing">Cancelar</AlertDialogCancel>
          <Button
            :disabled="clearing"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmClear"
          >
            {{ clearing ? "Limpando..." : "Limpar tudo" }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
