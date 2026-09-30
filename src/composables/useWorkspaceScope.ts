import { computed, watch, type WatchCallback } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";

const DEFAULT_MISSING_WORKSPACE_MESSAGE =
  "Selecione um projeto ou grupo no workspace para continuar.";

export function useWorkspaceScope() {
  const workspaceStore = useWorkspaceStore();

  const filterId = computed(() => workspaceStore.filterId);
  const projectId = computed(() => workspaceStore.numericProjectId);
  const groupId = computed(() => workspaceStore.numericGroupId);
  const isGroupWorkspace = computed(() => workspaceStore.isGroupWorkspace);
  const hasWorkspace = computed(() => workspaceStore.hasActiveWorkspace);

  function requireFilterId(
    onMissing?: (message: string) => void,
    message: string = DEFAULT_MISSING_WORKSPACE_MESSAGE
  ): string | null {
    const id = workspaceStore.filterId;
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
    filterId,
    projectId,
    groupId,
    isGroupWorkspace,
    hasWorkspace,
    requireFilterId,
    onWorkspaceChange,
  };
}
