<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import {
  MANAGE_PROJECT_API_KEYS_PERMISSION,
  useProjectApiKeysStore,
} from "@/stores/projectApiKeys";
import { normalizeProjectApiKeyError } from "@/services/projectApiKeys";
import { showApiErrorToast } from "@/lib/apiErrorFeedback";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import ProjectApiKeysTable from "@/components/project-api-keys/ProjectApiKeysTable.vue";
import ProjectApiKeySecretDialog from "@/components/project-api-keys/ProjectApiKeySecretDialog.vue";
import ProjectApiKeyFormDialog from "@/components/project-api-keys/ProjectApiKeyFormDialog.vue";
import ApiErrorAlert from "@/components/custom/ApiErrorAlert.vue";
import { ArrowLeftIcon, PlusIcon } from "lucide-vue-next";
import type {
  IssueProjectApiKeyRequest,
  ProjectApiKey,
} from "@/contracts/projectApiKeys";
import type { ProjectApiKeyStatusFilter } from "@/stores/projectApiKeys";

type FormServerErrors = Partial<
  Record<"name" | "scopes" | "rate_limit_per_minute" | "expires_at", string>
>;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const store = useProjectApiKeysStore();
const { filteredKeys, loading, error, isForbidden, statusFilter, ephemeralSecret } =
  storeToRefs(store);

// auth store é legada em JS; `user` chega sem tipagem estática.
const user = computed(() => authStore.user as any);

const hasPermission = (permissionName: string) =>
  Boolean(
    user.value?.roles?.some((role: any) =>
      role.permissions?.some(
        (permission: any) => permission.name === permissionName,
      ),
    ),
  );

/** A rota já é protegida por `permissions` no meta; 403 residual vira empty state. */
const canManage = computed(() =>
  hasPermission(MANAGE_PROJECT_API_KEYS_PERMISSION),
);

const projectId = computed(() => Number(route.params.id));

/** Nome do projeto no cabeçalho; fallback para o título genérico. */
const projectName = computed(() => {
  const id = projectId.value;
  const projects = [
    ...(user.value?.projects ?? []),
    ...(user.value?.ownerProjects ?? []),
  ] as { id: number; name: string }[];
  return projects.find((project) => project.id === id)?.name ?? null;
});

onMounted(() => {
  store.syncProject(projectId.value);
});

// Navegação entre projetos sem sair da tela: refetch obrigatório — a lista do
// projeto anterior nunca é exibida no novo contexto.
watch(projectId, (id) => {
  store.syncProject(id);
});

// Sair da tela encerra o fluxo de exibição única do secret.
onBeforeUnmount(() => {
  store.clearEphemeralSecret();
});

const statusOptions: { value: ProjectApiKeyStatusFilter; label: string }[] = [
  { value: "all", label: t("project_api_keys.status_all") },
  { value: "active", label: t("project_api_keys.status_active") },
  { value: "expired", label: t("project_api_keys.status_expired") },
  { value: "revoked", label: t("project_api_keys.status_revoked") },
];

// --- Formulário (criação e edição) ------------------------------------------

const formOpen = ref(false);
const editingKey = ref<ProjectApiKey | null>(null);
const isSubmittingForm = ref(false);
const formServerErrors = ref<FormServerErrors | null>(null);

function openCreateForm() {
  editingKey.value = null;
  formOpen.value = true;
}

function requestEdit(apiKey: ProjectApiKey) {
  editingKey.value = apiKey;
  formOpen.value = true;
}

/** Mapeia os erros de campo do 422 para os campos do formulário. */
function extractFormServerErrors(err: unknown): FormServerErrors | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 422) return null;

  const errors = err.response.data?.errors as
    | Record<string, string[] | string>
    | undefined;
  if (!errors) return null;

  const mapped: FormServerErrors = {};
  const fields = ["name", "scopes", "rate_limit_per_minute", "expires_at"] as const;

  for (const field of fields) {
    const value = errors[field];
    if (value == null) continue;
    mapped[field] = Array.isArray(value) ? String(value[0]) : String(value);
  }

  return Object.keys(mapped).length ? mapped : null;
}

async function handleFormSubmit(payload: IssueProjectApiKeyRequest) {
  isSubmittingForm.value = true;
  formServerErrors.value = null;

  try {
    if (editingKey.value) {
      // Atualização somente após confirmação do backend (sem optimistic update).
      await store.updateKey(editingKey.value.uuid, payload);
      toast(t("project_api_keys.update_success"));
    } else {
      // O secret retornado vai apenas para o estado volátil da store; o modal
      // bloqueante de exibição única abre em seguida via `ephemeralSecret`.
      await store.createKey(payload);
    }
    formOpen.value = false;
    editingKey.value = null;
  } catch (err) {
    const serverErrors = extractFormServerErrors(err);
    if (serverErrors) {
      // 422 com erros de campo: exibidos nos campos do formulário.
      formServerErrors.value = serverErrors;
    } else {
      showApiErrorToast(err, {
        fallbackKey: editingKey.value
          ? "project_api_keys.update_error"
          : "api_errors.generic",
      });
    }
  } finally {
    isSubmittingForm.value = false;
  }
}

// --- Rotação ---------------------------------------------------------------

const rotateTarget = ref<ProjectApiKey | null>(null);
const isRotating = ref(false);

async function confirmRotate() {
  if (!rotateTarget.value) return;

  isRotating.value = true;
  try {
    await store.rotateKey(rotateTarget.value.uuid);
    rotateTarget.value = null;
    toast(t("project_api_keys.rotate_success"));
  } catch (err) {
    showApiErrorToast(err, { fallbackKey: "project_api_keys.rotate_error" });
  } finally {
    isRotating.value = false;
  }
}

// --- Revogação -------------------------------------------------------------

const revokeTarget = ref<ProjectApiKey | null>(null);
const isRevoking = ref(false);
/** Confirmação digitada: deve ser igual ao nome da chave. */
const revokeConfirmation = ref("");

watch(revokeTarget, () => {
  revokeConfirmation.value = "";
});

const canConfirmRevoke = computed(
  () =>
    revokeTarget.value !== null &&
    revokeConfirmation.value.trim() === revokeTarget.value.name,
);

async function confirmRevoke() {
  if (!revokeTarget.value || !canConfirmRevoke.value) return;

  isRevoking.value = true;
  try {
    await store.revokeKey(revokeTarget.value.uuid);
    revokeTarget.value = null;
    toast(t("project_api_keys.revoke_success"));
  } catch (err) {
    showApiErrorToast(err, { fallbackKey: "project_api_keys.revoke_error" });
  } finally {
    isRevoking.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div class="space-y-0.5">
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            :title="t('project_api_keys.back_to_projects')"
            @click="router.push({ name: 'projects' })"
          >
            <ArrowLeftIcon class="size-4" />
          </Button>
          <h2 class="text-2xl font-bold tracking-tight">
            <template v-if="projectName">
              {{ t("project_api_keys.title_with_project", { name: projectName }) }}
            </template>
            <template v-else>{{ t("project_api_keys.title") }}</template>
          </h2>
        </div>
        <p class="text-muted-foreground">
          {{ t("project_api_keys.description") }}
        </p>
      </div>
      <Button v-if="canManage && !isForbidden" @click="openCreateForm">
        <PlusIcon class="size-4 mr-2" />
        {{ t("project_api_keys.new_key") }}
      </Button>
    </div>

    <Separator class="mb-4" />

    <!-- Forbidden residual (403): sem dados residuais -->
    <div v-if="isForbidden" class="border rounded-lg p-8 text-center">
      <p class="font-medium">{{ t("project_api_keys.forbidden_title") }}</p>
      <p class="text-sm text-muted-foreground mt-1">
        {{ t("project_api_keys.forbidden_description") }}
      </p>
    </div>

    <!-- Erro de carregamento: mensagem padronizada + request_id + retry -->
    <ApiErrorAlert
      v-else-if="error && !loading"
      :error="error"
      @retry="store.fetchKeys()"
    />

    <template v-else>
      <div class="flex justify-end mb-3">
        <Select
          :model-value="statusFilter"
          @update:model-value="
            store.setStatusFilter($event as ProjectApiKeyStatusFilter)
          "
        >
          <SelectTrigger class="w-48">
            <SelectValue :placeholder="t('project_api_keys.filter_status')" />
          </SelectTrigger>
          <SelectContent>
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

      <ProjectApiKeysTable
        :api-keys="filteredKeys"
        :loading="loading"
        :can-manage="canManage"
        @edit="requestEdit"
        @rotate="rotateTarget = $event"
        @revoke="revokeTarget = $event"
      />
    </template>

    <!-- Confirmação explícita de rotação (política immediate/overlap) -->
    <AlertDialog
      :open="rotateTarget !== null"
      @update:open="!$event && (rotateTarget = null)"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t("project_api_keys.rotate_title") }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("project_api_keys.rotate_description", {
                name: rotateTarget?.name,
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isRotating">
            {{ t("cancel") }}
          </AlertDialogCancel>
          <AlertDialogAction :disabled="isRotating" @click="confirmRotate">
            {{
              isRotating
                ? t("project_api_keys.rotate_loading")
                : t("project_api_keys.rotate_confirm")
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Revogação com confirmação digitada do nome da chave -->
    <AlertDialog
      :open="revokeTarget !== null"
      @update:open="!$event && (revokeTarget = null)"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t("project_api_keys.revoke_title") }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("project_api_keys.revoke_description", {
                name: revokeTarget?.name,
              })
            }}
            <strong class="block mt-1">
              {{ t("project_api_keys.revoke_irreversible") }}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div class="space-y-2">
          <Label for="revoke-confirmation" class="text-sm">
            {{
              t("project_api_keys.revoke_typed_hint", {
                name: revokeTarget?.name,
              })
            }}
          </Label>
          <Input
            id="revoke-confirmation"
            v-model="revokeConfirmation"
            :placeholder="revokeTarget?.name"
            :disabled="isRevoking"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isRevoking">
            {{ t("cancel") }}
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isRevoking || !canConfirmRevoke"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmRevoke"
          >
            {{
              isRevoking
                ? t("project_api_keys.revoke_loading")
                : t("project_api_keys.revoke_confirm")
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Formulário de emissão/edição -->
    <ProjectApiKeyFormDialog
      :open="formOpen"
      :mode="editingKey ? 'edit' : 'create'"
      :initial="editingKey"
      :submitting="isSubmittingForm"
      :server-errors="formServerErrors"
      @update:open="
        formOpen = $event;
        !$event && (editingKey = null);
        !$event && (formServerErrors = null);
      "
      @submit="handleFormSubmit"
    />

    <!-- Exibição única do secret (criação e rotação) -->
    <ProjectApiKeySecretDialog
      :secret="ephemeralSecret"
      @close="store.clearEphemeralSecret()"
    />
  </div>
</template>
