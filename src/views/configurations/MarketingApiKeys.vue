<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketingApiKeysStore } from "@/stores/marketingApiKeys";
import { normalizeMarketingApiKeyError } from "@/services/marketingApiKeys";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
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
import type { MarketingApiKey } from "@/contracts/marketingApiKeys";
import type { MarketingApiKeyStatusFilter } from "@/stores/marketingApiKeys";

const { t } = useI18n();
const { toast } = useToast();

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

function operationErrorMessage(err: unknown, fallbackKey: string): string {
  const normalized = normalizeMarketingApiKeyError(err);
  return normalized.code === "state_conflict"
    ? t("marketing_api_keys.state_conflict")
    : t(fallbackKey);
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
    toast({ description: t("marketing_api_keys.rotate_success") });
  } catch (err) {
    toast({
      title: t("error_ocurried"),
      description: operationErrorMessage(err, "marketing_api_keys.rotate_error"),
      variant: "destructive",
    });
  } finally {
    isRotating.value = false;
  }
}

// --- Revogação -------------------------------------------------------------

const revokeTarget = ref<MarketingApiKey | null>(null);
const isRevoking = ref(false);

async function confirmRevoke() {
  if (!revokeTarget.value) return;

  isRevoking.value = true;
  try {
    await store.revokeApiKey(revokeTarget.value.uuid);
    revokeTarget.value = null;
    toast({ description: t("marketing_api_keys.revoke_success") });
  } catch (err) {
    toast({
      title: t("error_ocurried"),
      description: operationErrorMessage(err, "marketing_api_keys.revoke_error"),
      variant: "destructive",
    });
  } finally {
    isRevoking.value = false;
  }
}

// --- Edição (tarefa 5 implementa o formulário) ------------------------------

function requestEdit(_apiKey: MarketingApiKey) {
  // O diálogo de edição é entregue na tarefa 5 da Fase 6.
}
</script>

<template>
  <div class="w-full">
    <div class="mb-4">
      <h3 class="text-lg font-medium">{{ t("marketing_api_keys.title") }}</h3>
      <p class="text-sm text-muted-foreground">
        {{ t("marketing_api_keys.description") }}
      </p>
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

    <!-- Erro genérico de carregamento -->
    <div
      v-else-if="error && !loading"
      class="border rounded-lg p-8 text-center space-y-3"
    >
      <p class="text-sm text-muted-foreground">
        {{ t("marketing_api_keys.error_loading") }}
      </p>
      <Button variant="outline" @click="store.fetchApiKeys()">
        {{ t("marketing_api_keys.retry") }}
      </Button>
    </div>

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

    <!-- Confirmação explícita de revogação -->
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isRevoking">
            {{ t("cancel") }}
          </AlertDialogCancel>
          <AlertDialogAction
            :disabled="isRevoking"
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

    <!-- Exibição única do secret (rotação; criação entra na tarefa 4) -->
    <MarketingApiKeySecretDialog
      :secret="ephemeralSecret"
      @close="store.clearEphemeralSecret()"
    />
  </div>
</template>
