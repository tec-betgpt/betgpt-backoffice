<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useWorkspaceStore } from "@/stores/workspace";
import webhookInspector, {
  type WebhookInspectorEndpoint,
  type WebhookInspectorEndpointPayload,
} from "@/services/webhookInspector";
import {
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  RadioReceiverIcon,
  Trash2Icon,
} from "lucide-vue-next";

const router = useRouter();
const workspaceStore = useWorkspaceStore();

// Endpoints são do projeto selecionado no workspace; em grupo não há um projeto só.
const projectId = computed(() => workspaceStore.numericProjectId);
const projectName = computed(() => workspaceStore.activeGroupProject?.name ?? "");

const endpoints = ref<WebhookInspectorEndpoint[]>([]);
const loading = ref(true);

const formOpen = ref(false);
const editing = ref<WebhookInspectorEndpoint | null>(null);
const submitting = ref(false);

const deleteTarget = ref<WebhookInspectorEndpoint | null>(null);
const deleting = ref(false);

async function load() {
  const project = projectId.value;
  endpoints.value = [];
  if (!project) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    endpoints.value = await webhookInspector.listEndpoints(project);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formOpen.value = true;
}

function openEdit(endpoint: WebhookInspectorEndpoint) {
  editing.value = endpoint;
  formOpen.value = true;
}

function openDetail(endpoint: WebhookInspectorEndpoint) {
  router.push({ name: "webhook-inspector-detail", params: { uuid: endpoint.uuid } });
}

async function copyUrl(endpoint: WebhookInspectorEndpoint) {
  try {
    await navigator.clipboard.writeText(endpoint.url);
    toast("URL copiada");
  } catch {
    toast.error("Não foi possível copiar a URL");
  }
}

async function handleSubmit(payload: WebhookInspectorEndpointPayload) {
  submitting.value = true;
  try {
    if (editing.value) {
      await webhookInspector.updateEndpoint(projectId.value!, editing.value.uuid, payload);
      toast("Endpoint atualizado");
      formOpen.value = false;
      await load();
    } else {
      const created = await webhookInspector.createEndpoint(projectId.value!, payload);
      formOpen.value = false;
      await navigator.clipboard?.writeText(created.url).catch(() => undefined);
      toast("Endpoint criado", { description: "A URL foi copiada." });
      openDetail(created);
    }
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  deleting.value = true;
  try {
    await webhookInspector.deleteEndpoint(projectId.value!, target.uuid);
    toast("Endpoint excluído");
    deleteTarget.value = null;
    await load();
  } catch (error) {
    console.error(error);
  } finally {
    deleting.value = false;
  }
}

function lastRequest(endpoint: WebhookInspectorEndpoint) {
  return endpoint.last_request_at ? moment(endpoint.last_request_at).fromNow() : "Nunca";
}

onMounted(load);
watch(projectId, load);
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div class="space-y-0.5">
        <h2 class="text-2xl font-bold tracking-tight">
          Webhook Inspector<template v-if="projectId && projectName"> · {{ projectName }}</template>
        </h2>
        <p class="text-muted-foreground">
          URLs temporárias que guardam toda requisição recebida (método, headers, query e corpo).
          Use para acompanhar postbacks, testar integrações e depurar funis em desenvolvimento.
        </p>
      </div>
      <Button v-if="projectId" @click="openCreate">
        <PlusIcon class="size-4 mr-2" />
        Novo endpoint
      </Button>
    </div>

    <Separator class="mb-4" />

    <div
      v-if="!projectId"
      class="border rounded-lg p-10 text-center flex flex-col items-center gap-3"
    >
      <RadioReceiverIcon class="size-8 text-muted-foreground" />
      <p class="font-medium">Selecione um projeto</p>
      <p class="text-sm text-muted-foreground max-w-md">
        Cada endpoint pertence a um projeto. Escolha um projeto no seletor de workspace para ver
        ou criar os endpoints dele.
      </p>
    </div>

    <div v-else-if="loading" class="space-y-2">
      <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>

    <div
      v-else-if="endpoints.length === 0"
      class="border rounded-lg p-10 text-center flex flex-col items-center gap-3"
    >
      <RadioReceiverIcon class="size-8 text-muted-foreground" />
      <p class="font-medium">Nenhum endpoint ainda</p>
      <p class="text-sm text-muted-foreground max-w-md">
        Crie um endpoint, cole a URL como postback ou webhook no sistema que vai enviar e veja as
        requisições chegarem em tempo real.
      </p>
      <Button class="mt-2" @click="openCreate">
        <PlusIcon class="size-4 mr-2" />
        Criar o primeiro endpoint
      </Button>
    </div>

    <div v-else class="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Requisições</TableHead>
            <TableHead>Última</TableHead>
            <TableHead>Criado por</TableHead>
            <TableHead class="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="endpoint in endpoints"
            :key="endpoint.uuid"
            class="cursor-pointer"
            @click="openDetail(endpoint)"
          >
            <TableCell class="min-w-[180px]">
              <p class="font-medium">{{ endpoint.name }}</p>
              <p
                v-if="endpoint.description"
                class="text-xs text-muted-foreground line-clamp-1 max-w-xs"
              >
                {{ endpoint.description }}
              </p>
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-1">
                <code class="text-xs bg-muted rounded px-1.5 py-0.5 whitespace-nowrap">
                  {{ endpoint.url }}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-7"
                  title="Copiar URL"
                  @click.stop="copyUrl(endpoint)"
                >
                  <CopyIcon class="size-3.5" />
                </Button>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="endpoint.is_active ? 'default' : 'secondary'">
                {{ endpoint.is_active ? "Ativo" : "Pausado" }}
              </Badge>
            </TableCell>
            <TableCell class="text-right tabular-nums">{{ endpoint.requests_count }}</TableCell>
            <TableCell class="whitespace-nowrap text-sm">{{ lastRequest(endpoint) }}</TableCell>
            <TableCell class="text-sm">{{ endpoint.created_by?.name ?? "—" }}</TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="size-8">
                    <EllipsisIcon class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openDetail(endpoint)">
                    <EyeIcon class="size-4 mr-2" /> Ver requisições
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="openEdit(endpoint)">
                    <PencilIcon class="size-4 mr-2" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem class="text-destructive" @click="deleteTarget = endpoint">
                    <Trash2Icon class="size-4 mr-2" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <EndpointFormDialog
      :open="formOpen"
      :initial="editing"
      :submitting="submitting"
      @update:open="formOpen = $event"
      @submit="handleSubmit"
    />

    <AlertDialog
      :open="deleteTarget !== null"
      @update:open="!$event && !deleting && (deleteTarget = null)"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir endpoint?</AlertDialogTitle>
          <AlertDialogDescription>
            "{{ deleteTarget?.name }}" e as {{ deleteTarget?.requests_count ?? 0 }} requisições
            guardadas serão apagados. A URL para de receber na hora e não pode ser recuperada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">Cancelar</AlertDialogCancel>
          <Button
            :disabled="deleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDelete"
          >
            {{ deleting ? "Excluindo..." : "Excluir" }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
