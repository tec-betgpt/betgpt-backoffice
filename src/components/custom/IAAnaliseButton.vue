<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";
import { useIAAnaliseStore } from "@/stores/iaAnalise";
import { useRoute } from "vue-router";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-vue-next";

const workspaceStore = useWorkspaceStore();
const iaAnaliseStore = useIAAnaliseStore();
const route = useRoute();

const props = defineProps<{
  openSidebar?: () => void;
}>();

const emit = defineEmits<{
  (e: 'openSidebar'): void;
}>();

const openSidebar = () => {
  emit('openSidebar');
  props.openSidebar?.();
};

const handleClick = async () => {
  if (!workspaceStore.activeGroupProject?.id) {
    toast.error("Erro", { description: "Selecione um projeto antes de usar o Assistant IA." });
    return;
  }

  if (iaAnaliseStore.isLoading) {
    toast.error("Aguarde", { description: "Já tem uma análise em andamento." });
    return;
  }

  toast("IA Analise", { description: "Dados enviados para análise." });

  try {
    const newChat = await IntelligenceArtificial.createSession({
      project_id: workspaceStore.activeGroupProject.project_id,
    });
    const chatId = String(newChat.data.id);

    iaAnaliseStore.startAnalise(chatId);
    openSidebar();

    const contextString = workspaceStore.context
      ? workspaceStore.context.join("\n")
      : "";

    const message = `Passe o Feedback de dados dessa tela e adicione insights relevantes.`;

    await IntelligenceArtificial.sendMessage({
      chat_id: parseInt(chatId),
      project_id: workspaceStore.activeGroupProject.id,
      message: message,
      context: {
        url: route.path,
        date: workspaceStore.date,
        context: contextString,
      },
    });

    iaAnaliseStore.setPendingChat(chatId);
    iaAnaliseStore.finishAnalise();

  } catch (error) {
    console.error("Erro ao enviar para IA:", error);
    toast.error("Erro", { description: "Não foi possível enviar os dados para análise." });
    iaAnaliseStore.setError("Não foi possível concluir a análise. Tente novamente.");
    iaAnaliseStore.finishAnalise();
  }
};
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    class="gap-2"
    @click="handleClick"
    :disabled="iaAnaliseStore.isLoading"
  >
    <Loader2 v-if="iaAnaliseStore.isLoading" class="w-4 h-4 animate-spin" />
    <Sparkles v-else class="w-4 h-4" />
    <span class="hidden md:block">IA Análise</span>
  </Button>
</template>
