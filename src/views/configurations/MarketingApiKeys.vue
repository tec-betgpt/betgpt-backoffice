<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketingApiKeysStore } from "@/stores/marketingApiKeys";
import { normalizeMarketingApiKeyError } from "@/services/marketingApiKeys";
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
import MarketingApiKeysTable from "@/components/marketing-api-keys/MarketingApiKeysTable.vue";
import MarketingApiKeySecretDialog from "@/components/marketing-api-keys/MarketingApiKeySecretDialog.vue";
import MarketingApiKeyFormDialog from "@/components/marketing-api-keys/MarketingApiKeyFormDialog.vue";
import ApiErrorAlert from "@/components/custom/ApiErrorAlert.vue";
import { PlusIcon } from "lucide-vue-next";
import type {
  CreateMarketingApiKeyPayload,
  MarketingApiKey,
} from "@/contracts/marketingApiKeys";
import type { MarketingApiKeyStatusFilter } from "@/stores/marketingApiKeys";

const { t } = useI18n();

const workspaceStore = useWorkspaceStore();
const store = useMarketingApiKeysStore();
const {
  filteredKeys,
  loading,
  error,
  isForbidden,
  canManage,
  statusFilter,
  ephemeralSecret,
} = storeToRefs(store);

const activeWorkspaceKey = computed(
  () => workspaceStore.activeGroupProject?.id ?? null,
);

onMounted(() => {
  store.syncWorkspace(activeWorkspaceKey.value);
});

// Troca de workspace: refetch obrigatório — a lista do grupo anterior
// nunca é exibida no novo contexto.
watch(activeWorkspaceKey, (workspaceKey) => {
  store.syncWorkspace(workspaceKey);
});

// Sair da tela encerra o fluxo de exibição única do secret.
onBeforeUnmount(() => {
  store.clearEphemeralSecret();
});

const hasWorkspace = computed(() => store.activeGroupId != null);

const statusOptions: { value: MarketingApiKeyStatusFilter; label: string }[] = [
  { value: "all", label: t("marketing_api_keys.status_all") },
  { value: "active", label: t("marketing_api_keys.status_active") },
  { value: "expired", label: t("marketing_api_keys.status_expired") },
  { value: "revoked", label: t("marketing_api_keys.status_revoked") },
];

// --- Formulário (criação e edição) ------------------------------------------

const formOpen = ref(false);
const editingKey = ref<MarketingApiKey | null>(null);
const isSubmittingForm = ref(false);

function openCreateForm() {
  editingKey.value = null;
  formOpen.value = true;
}

function requestEdit(apiKey: MarketingApiKey) {
  editingKey.value = apiKey;
  formOpen.value = true;
}

async function handleFormSubmit(payload: CreateMarketingApiKeyPayload) {
  isSubmittingForm.value = true;
  try {
    if (editingKey.value) {
      // Atualização somente após confirmação do backend (sem optimistic update).
      await store.updateApiKey(editingKey.value.uuid, payload);
      toast(t("marketing_api_keys.update_success"));
    } else {
      // O secret retornado vai apenas para o estado volátil da store; o modal
      // bloqueante de exibição única abre em seguida via `ephemeralSecret`.
      await store.createApiKey(payload);
    }
    formOpen.value = false;
    editingKey.value = null;
  } catch (err) {
    if (normalizeMarketingApiKeyError(err).code === "state_conflict") {
      showApiErrorToast(err);
    }
    // Demais erros: feedback já é exibido pelo interceptor global (422/500/rede).
  } finally {
    isSubmittingForm.value = false;
  }
}

// --- Rotação ---------------------------------------------------------------

const rotateTarget = ref<MarketingApiKey | null>(null);
const isRotating = ref(false);

async function confirmRotate() {
  if (!rotateTarget.value) return;

  isRotating.value = true;
  try {
    await store.rotateApiKey(rotateTarget.value.uuid);
    rotateTarget.value = null;
    toast(t("marketing_api_keys.rotate_success"));
  } catch (err) {
    showApiErrorToast(err, { fallbackKey: "marketing_api_keys.rotate_error" });
  } finally {
    isRotating.value = false;
  }
}

// --- Revogação -------------------------------------------------------------

const revokeTarget = ref<MarketingApiKey | null>(null);
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
    await store.revokeApiKey(revokeTarget.value.uuid);
    revokeTarget.value = null;
    toast(t("marketing_api_keys.revoke_success"));
  } catch (err) {
    showApiErrorToast(err, { fallbackKey: "marketing_api_keys.revoke_error" });
  } finally {
    isRevoking.value = false;
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-medium">{{ t("marketing_api_keys.title") }}</h3>
        <p class="text-sm text-muted-foreground">
          {{ t("marketing_api_keys.description") }}
        </p>
      </div>
      <Button
        v-if="canManage && hasWorkspace && !isForbidden"
        @click="openCreateForm"
      >
        <PlusIcon class="size-4 mr-2" />
        {{ t("marketing_api_keys.create_button") }}
      </Button>
    </div>

    <Separator class="mb-4" />

    <!-- Sem grupo de projetos selecionado -->
    <div
      v-if="!hasWorkspace && !loading"
      class="border rounded-lg p-8 text-center"
    >
      <p class="font-medium">{{ t("marketing_api_keys.no_workspace_title") }}</p>
      <p class="text-sm text-muted-foreground mt-1">
        {{ t("marketing_api_keys.no_workspace_description") }}
      </p>
    </div>

    <!-- Forbidden (403): sem dados residuais -->
    <div v-else-if="isForbidden" class="border rounded-lg p-8 text-center">
      <p class="font-medium">{{ t("marketing_api_keys.forbidden_title") }}</p>
      <p class="text-sm text-muted-foreground mt-1">
        {{ t("marketing_api_keys.forbidden_description") }}
      </p>
    </div>

    <!-- Erro de carregamento: mensagem padronizada + request_id + retry -->
    <ApiErrorAlert
      v-else-if="error && !loading"
      :error="error"
      @retry="store.fetchApiKeys()"
    />

    <template v-else>
      <div class="flex justify-end mb-3">
        <Select
          :model-value="statusFilter"
          @update:model-value="
            store.setStatusFilter($event as MarketingApiKeyStatusFilter)
          "
        >
          <SelectTrigger class="w-48">
            <SelectValue
              :placeholder="t('marketing_api_keys.filter_status')"
            />
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

      <MarketingApiKeysTable
        :api-keys="filteredKeys"
        :loading="loading"
        :can-manage="canManage"
        @edit="requestEdit"
        @rotate="rotateTarget = $event"
        @revoke="revokeTarget = $event"
      />
    </template>

    <!-- Confirmação explícita de rotação -->
    <AlertDialog
      :open="rotateTarget !== null"
      @update:open="!$event && (rotateTarget = null)"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t("marketing_api_keys.rotate_title") }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("marketing_api_keys.rotate_description", {
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
                ? t("marketing_api_keys.rotate_loading")
                : t("marketing_api_keys.rotate_confirm")
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
            {{ t("marketing_api_keys.revoke_title") }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t("marketing_api_keys.revoke_description", {
                name: revokeTarget?.name,
              })
            }}
            <strong class="block mt-1">
              {{ t("marketing_api_keys.revoke_irreversible") }}
            </strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div class="space-y-2">
          <Label for="revoke-confirmation" class="text-sm">
            {{ t("marketing_api_keys.revoke_typed_hint") }}
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
                ? t("marketing_api_keys.revoke_loading")
                : t("marketing_api_keys.revoke_confirm")
            }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Formulário de emissão/edição -->
    <MarketingApiKeyFormDialog
      :open="formOpen"
      :mode="editingKey ? 'edit' : 'create'"
      :initial="editingKey"
      :submitting="isSubmittingForm"
      @update:open="
        formOpen = $event;
        !$event && (editingKey = null);
      "
      @submit="handleFormSubmit"
    />

    <!-- Exibição única do secret (criação e rotação) -->
    <MarketingApiKeySecretDialog
      :secret="ephemeralSecret"
      @close="store.clearEphemeralSecret()"
    />
  </div>
</template>
