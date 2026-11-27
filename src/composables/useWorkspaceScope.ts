import { computed, watch, type WatchCallback } from "vue";
import { useRoute } from "vue-router";
import { useWorkspaceStore } from "@/stores/workspace";

export type FixedFinanceScope = "elevate" | "all";

const DEFAULT_MISSING_WORKSPACE_MESSAGE =
  "Selecione um projeto ou grupo no workspace para continuar.";

export function useWorkspaceScope() {
  const workspaceStore = useWorkspaceStore();
  const route = useRoute();

  // No Admin da v2 o Financeiro tem escopo fixo (a própria Elevate ou todas as contas),
  // nunca o último workspace aberto.
  const fixedScope = computed(
    () => (route?.meta?.financeScope as FixedFinanceScope | undefined) ?? null
  );
  const isElevate = computed(() => fixedScope.value === "elevate");

  const filterId = computed(() => fixedScope.value ?? workspaceStore.filterId);
  const projectId = computed(() => (fixedScope.value ? null : workspaceStore.numericProjectId));
  const groupId = computed(() => (fixedScope.value ? null : workspaceStore.numericGroupId));
  const isGroupWorkspace = computed(() => !fixedScope.value && workspaceStore.isGroupWorkspace);
  const hasWorkspace = computed(() => Boolean(fixedScope.value) || workspaceStore.hasActiveWorkspace);

  function requireFilterId(
    onMissing?: (message: string) => void,
    message: string = DEFAULT_MISSING_WORKSPACE_MESSAGE
  ): string | null {
    const id = filterId.value;
    if (!id) {
      onMissing?.(message);
      return null;
    }
    return id;
  }

  function onWorkspaceChange(callback: WatchCallback<string | null>) {
    watch(filterId, callback);
  }

  return {
    fixedScope,
    isElevate,
    filterId,
    projectId,
    groupId,
    isGroupWorkspace,
    hasWorkspace,
    requireFilterId,
    onWorkspaceChange,
  };
}
