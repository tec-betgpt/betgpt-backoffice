<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Confirmação de Alteração de E-mail</h3>
      <p class="text-sm text-muted-foreground">
        Estamos processando sua solicitação. Por favor, aguarde.
      </p>
    </div>
    <div v-if="loading" class="flex items-center space-x-2">
      <LucideSpinner class="h-5 w-5 animate-spin" />
      <span>Verificando solicitação...</span>
    </div>
    <div v-else>
      <p v-if="success" class="text-green-600">
        Seu e-mail foi alterado com sucesso.
      </p>
      <p v-else class="text-red-600">
        Houve um problema ao processar sua solicitação. Por favor, tente
        novamente.
      </p>
    </div>
    <Button @click="goBack" class="mt-4">Voltar para o perfil</Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "@/components/ui/toast/use-toast";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";

const { toast } = useToast();
const loading = ref(true);
const success = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const verifyEmailChange = async () => {
  try {
    const token = route.params.token;
    if (!token) {
      throw new Error("Token não fornecido.");
    }

    const response = await api.post(
      `/user/configurations/confirm-email-change/${token}`
    );
    success.value = response.data.success;

    if (success.value && response.data.data.email) {
      authStore.user.email = response.data.data.email;
      authStore.user.email_change_request = null;

      toast({
        title: "Sucesso",
        description: "E-mail alterado com sucesso.",
        variant: "success",
      });

      goBack();
    } else {
      throw new Error("Resposta inválida do servidor.");
    }
  } catch (error) {
    console.error("Erro ao confirmar alteração de e-mail:", error);
    toast({
      title: "Erro",
      description: "Não foi possível confirmar a alteração do e-mail.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: "configurations.profile" });
};

onMounted(verifyEmailChange);
</script>
