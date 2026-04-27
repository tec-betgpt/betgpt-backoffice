import { watch, onMounted, onUnmounted } from "vue"
import { useWorkspaceStore } from "@/stores/workspace"

export function useScreenContext(
  screenDescription: string,
  getSelectedData: () => Record<string, any>
) {
  const workspaceStore = useWorkspaceStore()

  onMounted(() => {
    workspaceStore.setContext(null)
  })

  watch(
    () => getSelectedData(),
    (data) => {
      const contextArray = [
        screenDescription,
        ...Object.entries(data).map(([key, value]) => `${key}: ${value}`),
      ]
      workspaceStore.setContext(contextArray)
    },
    { immediate: true, deep: true }
  )

  onUnmounted(() => {
    workspaceStore.setContext(null)
  })
}