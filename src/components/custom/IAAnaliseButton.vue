<script setup lang="ts">
import { ref } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useRoute, useRouter } from "vue-router";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-vue-next";

const workspaceStore = useWorkspaceStore();
const route = useRoute();
const router = useRouter();

const isLoading = ref(false);

const handleClick = async () => {
  if (!workspaceStore.activeGroupProject?.id) {
    toast({
      title: "Erro",
      description: "Selecione um projeto antes de usar o Assistant IA.",
      variant: "destructive",
    });
    return;
  }

  isLoading.value = true;
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

    router.push({ name: "chat-ia", query: { chatId: parseInt(chatId) } });


  } catch (error) {
    console.error("Erro ao enviar para IA:", error);
    toast({
      title: "Erro",
      description: "Não foi possível enviar os dados para análise.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    class="gap-2"
    @click="handleClick"
    :disabled="isLoading"
  >
    <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
    <Sparkles v-else class="w-4 h-4" />
    IA Análise
  </Button>
</template>