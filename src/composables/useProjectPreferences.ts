import {onMounted, onUnmounted, ref} from "vue";
import ProjectPreferences from "@/services/projectPreferences";
import {useWorkspaceStore} from "@/stores/workspace";

export const gaNicknameStorageKey = "ga_channel_group_nickname";

export const useProjectPreferences = () => {

  let intervalId: ReturnType<typeof setInterval> | null = null
  const gaGroupNickname = ref<string | null>(
    localStorage.getItem(gaNicknameStorageKey)
  );
  const workspace = useWorkspaceStore()
  const loadGaGroupNickname = async () => {
    try {
      const response = await ProjectPreferences.index({
        // @ts-ignore
        filter_id: String(workspace.activeGroupProject.id),
      });

      if (response.data?.google_analytics_channel_group) {
        const nickname = response.data.google_analytics_channel_group.nickname;
        localStorage.setItem(gaNicknameStorageKey, nickname);
        gaGroupNickname.value = nickname;
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    }
  };

  onMounted(()=>{
    intervalId = setInterval(loadGaGroupNickname, 30000)
  })
  onUnmounted(()=>{
    if (intervalId) {clearInterval(intervalId)}
  })
};