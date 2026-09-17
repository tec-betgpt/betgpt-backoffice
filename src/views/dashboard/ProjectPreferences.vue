<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings2, Plus, Trash2, Globe } from "lucide-vue-next";
import ProjectPreferencesService from "@/services/projectPreferences";
import LinkDomainsService from "@/services/linkDomains";
import { LinkDomain, LinkDomainSslStatus, LinkDomainStatus } from "@/contracts/linkDomain";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import moment from "moment";

const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

const loading = ref(false);
const saving = ref(false);
const slug = ref("");

const domains = ref<LinkDomain[]>([]);
const domainsLoading = ref(false);
const isAddDialogOpen = ref(false);
const newDomain = ref("");
const addingDomain = ref(false);
const isDeleteDialogOpen = ref(false);
const domainToDelete = ref<LinkDomain | null>(null);
const deletingDomain = ref(false);

const projectIdNumber = computed(() => Number(workspaceStore.activeGroupProject?.project_id));

const authUser = computed(() => authStore.user as any);

const canManageDomains = computed(
  () =>
    authUser.value?.roles?.some(
      (role: any) => role.name === "member-admin" || role.name === "member-proprietor" || role.name === "member-developer",
    ) ?? false,
);

const loadCurrentPreference = async () => {
  loading.value = true;
  try {
    const response = await ProjectPreferencesService.show(projectIdNumber.value);
    if (response?.data?.slug) {
      slug.value = response.data.slug;
    } else {
      slug.value = "";
    }
  } catch (error) {
    console.error("Erro ao carregar preferências do projeto:", error);
    slug.value = "";
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const payload = {
      project_id: projectIdNumber.value,
      slug: slug.value.trim(),
    };

    await ProjectPreferencesService.store(payload);

    toast("Sucesso", { description: "Preferências do projeto salvas com sucesso." });
  } catch (error) {
    console.error("Erro ao salvar preferências do projeto:", error);
    toast.error("Erro", { description: "Não foi possível salvar as preferências do projeto." });
  } finally {
    saving.value = false;
  }
};

const fetchDomains = async () => {
  domainsLoading.value = true;
  try {
    domains.value = await LinkDomainsService.index(projectIdNumber.value);
  } catch (error) {
    console.error("Erro ao carregar domínios:", error);
    toast.error("Erro", { description: "Não foi possível carregar os domínios do projeto." });
  } finally {
    domainsLoading.value = false;
  }
};

const openAddDialog = () => {
  newDomain.value = "";
  isAddDialogOpen.value = true;
};

const handleAddDomain = async () => {
  const domain = newDomain.value.trim();
  if (!domain) return;

  addingDomain.value = true;
  try {
    await LinkDomainsService.store({
      project_id: projectIdNumber.value,
      domain,
    });
    toast("Sucesso", { description: "Domínio cadastrado com sucesso." });
    isAddDialogOpen.value = false;
    newDomain.value = "";
    await fetchDomains();
  } catch (error: any) {
    console.error("Erro ao cadastrar domínio:", error);
    toast.error("Erro", { description: error.response?.data?.message || "Não foi possível cadastrar o domínio." });
  } finally {
    addingDomain.value = false;
  }
};

const confirmDelete = (domain: LinkDomain) => {
  domainToDelete.value = domain;
  isDeleteDialogOpen.value = true;
};

const handleDeleteDomain = async () => {
  if (!domainToDelete.value) return;

  deletingDomain.value = true;
  try {
    await LinkDomainsService.destroy(domainToDelete.value.id);
    toast("Sucesso", { description: "Domínio removido com sucesso." });
    isDeleteDialogOpen.value = false;
    domainToDelete.value = null;
    await fetchDomains();
  } catch (error: any) {
    console.error("Erro ao remover domínio:", error);
    toast.error("Erro", { description: error.response?.data?.message || "Não foi possível remover o domínio." });
    isDeleteDialogOpen.value = false;
  } finally {
    deletingDomain.value = false;
  }
};

const formatDate = (date: string | null) => {
  return date ? moment(date).format("DD/MM/YYYY HH:mm") : "—";
};

const statusVariant = (status: LinkDomainStatus): "default" | "secondary" | "destructive" => {
  const map = {
    [LinkDomainStatus.CONFIGURED]: "default" as const,
    [LinkDomainStatus.PENDING]: "secondary" as const,
    [LinkDomainStatus.ERROR]: "destructive" as const,
  };
  return map[status] ?? "secondary";
};

const statusLabel = (status: LinkDomainStatus) => {
  const map: Record<LinkDomainStatus, string> = {
    [LinkDomainStatus.CONFIGURED]: "Configurado",
    [LinkDomainStatus.PENDING]: "Pendente",
    [LinkDomainStatus.ERROR]: "Erro",
  };
  return map[status] ?? status;
};

const sslStatusVariant = (status: LinkDomainSslStatus | null): "default" | "secondary" | "destructive" => {
  const map: Record<string, "default" | "secondary" | "destructive"> = {
    [LinkDomainSslStatus.CONFIGURED]: "default",
    [LinkDomainSslStatus.PENDING]: "secondary",
    [LinkDomainSslStatus.ERROR]: "destructive",
  };
  return (status && map[status]) || "secondary";
};

const sslStatusLabel = (status: LinkDomainSslStatus | null) => {
  if (!status) return "—";
  const map: Record<string, string> = {
    [LinkDomainSslStatus.CONFIGURED]: "Configurado",
    [LinkDomainSslStatus.PENDING]: "Pendente",
    [LinkDomainSslStatus.ERROR]: "Erro",
  };
  return map[status] ?? status;
};

onMounted(async () => {
  await loadCurrentPreference();
  await fetchDomains();
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Settings2 class="h-5 w-5" />
        Preferências do Projeto
      </h2>
      <p class="text-muted-foreground">
        Configure as preferências gerais do projeto.
      </p>
    </div>

    <div class="space-y-6 py-4">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2">
        <Label class="text-base font-medium">Slug do Projeto</Label>
        <p class="text-sm text-muted-foreground">
          Identificador amigável usado em outras partes do sistema. Use apenas letras maiúsculas.
        </p>
      </div>

      <div v-if="loading">
        <div class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else class="space-y-2">
        <Input
          id="slug"
          v-model="slug"
          placeholder="Ex: EVL"
        />
      </div>
    </div>

    <div class="bg-muted/50 rounded-lg p-4 space-y-4 mt-8">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <Globe class="h-5 w-5 text-muted-foreground" />
            <Label class="text-base font-medium">Domínios Personalizados de Links</Label>
          </div>
          <p class="text-sm text-muted-foreground">
            Domínios cadastrados que podem ser usados como domínio próprio dos links do projeto. O domínio deve estar acessível via HTTPS com DNS resolvível.
          </p>
        </div>
        <Button v-if="canManageDomains" @click="openAddDialog" size="sm">
          <Plus class="mr-2 h-4 w-4" /> Adicionar Domínio
        </Button>
      </div>

      <div class="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domínio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SSL</TableHead>
              <TableHead>Última verificação</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead v-if="canManageDomains" class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="domainsLoading">
              <TableCell colspan="6" class="h-24 text-center">
                <div class="flex items-center justify-center gap-2">
                  <Spinner class="h-4 w-4" />
                  Carregando domínios...
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="!domains.length">
              <TableCell colspan="6" class="h-24 text-center">
                Nenhum domínio cadastrado.
              </TableCell>
            </TableRow>
            <TableRow v-for="domain in domains" :key="domain.id">
              <TableCell>
                <code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold">
                  {{ domain.domain }}
                </code>
                <p v-if="domain.status === LinkDomainStatus.ERROR && domain.error_message" class="text-xs text-destructive mt-1">
                  {{ domain.error_message }}
                </p>
              </TableCell>
              <TableCell>
                <Badge :variant="statusVariant(domain.status)">
                  {{ statusLabel(domain.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="sslStatusVariant(domain.ssl_status)">
                  {{ sslStatusLabel(domain.ssl_status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(domain.checked_at) }}
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(domain.created_at) }}
              </TableCell>
              <TableCell v-if="canManageDomains" class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  :disabled="deletingDomain"
                  @click="confirmDelete(domain)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <div class="flex gap-2">
      <Button @click="handleSave" :disabled="loading || saving">
        <span v-if="saving">Salvando...</span>
        <span v-else>Salvar Preferências</span>
      </Button>
    </div>

    <Dialog v-model:open="isAddDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Domínio</DialogTitle>
          <DialogDescription>
            Informe o domínio que os links do projeto poderão usar como domínio próprio.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-2">
          <Label>Domínio</Label>
          <Input
            v-model="newDomain"
            placeholder="Ex: https://campanha.com.br"
            :disabled="addingDomain"
            @keyup.enter="handleAddDomain"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" :disabled="addingDomain" @click="isAddDialogOpen = false">
            Cancelar
          </Button>
          <Button
            @click="handleAddDomain"
            :disabled="addingDomain || !newDomain.trim()"
          >
            <span v-if="addingDomain">Cadastrando...</span>
            <span v-else>Cadastrar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="isDeleteDialogOpen" @update:open="isDeleteDialogOpen = false">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O domínio
            <strong>{{ domainToDelete?.domain }}</strong> será removido do projeto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deletingDomain">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            @click="handleDeleteDomain"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deletingDomain"
          >
            <span v-if="deletingDomain">Removendo...</span>
            <span v-else>Remover</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>