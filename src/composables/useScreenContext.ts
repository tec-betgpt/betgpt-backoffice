import { watch, onMounted, onUnmounted } from "vue"
import { useWorkspaceStore } from "@/stores/workspace"

export function useScreenContext(
  screenDescription: string,
  getSelectedData: () => Record<string, any>,
  apiUrl?: string
) {
  const workspaceStore = useWorkspaceStore()

  onMounted(() => {
    workspaceStore.setContext([])
  })

  watch(
    () => getSelectedData(),
    (data) => {
      const contextArray = [
        screenDescription,
        ...Object.entries(data).map(([key, value]) => `${key}: ${value}`),
      ]
      
      if (apiUrl) {
        contextArray.push(`API: ${apiUrl}`)
      }
      
      workspaceStore.setContext(contextArray)
    },
    { immediate: true, deep: true }
  )

  onUnmounted(() => {
    workspaceStore.setContext([])
  })
}