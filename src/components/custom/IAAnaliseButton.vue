<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";
import { useIAAnaliseStore } from "@/stores/iaAnalise";
import { useRoute } from "vue-router";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-vue-next";

const workspaceStore = useWorkspaceStore();
const iaAnaliseStore = useIAAnaliseStore();
const route = useRoute();

const handleClick = async () => {
  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um projeto antes de usar o Assistant IA.",
      variant: "destructive",
    });
    return;
  }

  if (iaAnaliseStore.isLoading) {
    toast({
      title: "Aguarde",
      description: "Já tem uma análise em andamento.",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "IA Analise",
    description: "Dados enviados para análise.",
  });
  try {
    let chatId = localStorage.getItem("chatId");

    if (!chatId) {
      const newChat = await IntelligenceArtificial.createSession({
        project_id: workspaceStore.activeGroupProject.project_id,
      });
      chatId = newChat.data.id;
      localStorage.setItem("chatId", `${chatId}`);
    }

    iaAnaliseStore.startAnalise(chatId);

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

    iaAnaliseStore.finishAnalise();

  } catch (error) {
    console.error("Erro ao enviar para IA:", error);
    toast({
      title: "Erro",
      description: "Não foi possível enviar os dados para análise.",
      variant: "destructive",
    });
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
    IA Análise
  </Button>
</template>