<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="mb-4">
      <h3 class="text-lg font-medium">Configuração do Bot Jarbas</h3>
      <p class="text-sm text-muted-foreground">
        Gerencie as preferências de interação, ativação e feedback do bot.
      </p>
    </div>
    <Separator class="mb-6" />

    <div class="flex items-center gap-4 bg-muted rounded-xl p-6 mb-6 shadow">
      <img
        src="/jarbas-avatar.jpg"
        alt="Avatar Jarbas"
        class="w-20 h-20 rounded-full object-cover border border-primary"
      />
      <div>
        <h2 class="text-xl font-bold">Oi, eu sou o Jarbas BOT</h2>
        <p class="text-muted-foreground">
          Vamos deixar sua experiência no WhatsApp mais eficiente? Ative o bot e
          personalize do seu jeito!
        </p>
      </div>
    </div>

    <form @submit.prevent="submit">
      <div class="mb-8">
        <h4 class="text-md font-medium mb-4">Ativação do Bot</h4>
        <div class="space-y-4">
          <div class="flex flex-col space-y-2 rounded-lg border p-4">
            <Label for="whatsapp_number">Número de WhatsApp</Label>
            <Input
              v-model="formattedWhatsappNumber"
              id="whatsapp_number"
              placeholder="+55 (00) 00000-0000"
              required
              @input="formatWhatsappNumber"
            />
            <p class="text-sm text-muted-foreground">
              Número que será vinculado ao Jarbas.
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex flex-col space-y-2 rounded-lg border p-4">
              <Label for="user_name">Como o Jarbas deve te chamar</Label>
              <Input
                v-model="form.user_name"
                id="user_name"
                placeholder="Ex: amigo, cliente, parceiro"
              />
            </div>

            <div class="flex flex-col space-y-2 rounded-lg border p-4">
              <Label for="user_role">O que você faz</Label>
              <Input
                v-model="form.user_role"
                id="user_role"
                placeholder="Ex: vendedor, gerente, atendente"
              />
              <p class="text-sm text-muted-foreground">
                Descreva a sua atividade ou função principal.
              </p>
            </div>

            <div class="flex flex-col space-y-2 rounded-lg border p-4">
              <Label>Características do Jarbas</Label>
              <div class="grid grid-cols-2 gap-2">
                <div class="flex items-center space-x-2">
                  <Checkbox
                    v-model:checked="form.bot_traits.kind"
                    id="trait_simpatico"
                  />
                  <label for="trait_simpatico" class="text-sm">Simpático</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    v-model:checked="form.bot_traits.funny"
                    id="trait_engracado"
                  />
                  <label for="trait_engracado" class="text-sm">Engraçado</label>
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    v-model:checked="form.bot_traits.professional"
                    id="trait_profissional"
                  />
                  <label for="trait_profissional" class="text-sm"
                    >Profissional</label
                  >
                </div>
                <div class="flex items-center space-x-2">
                  <Checkbox
                    v-model:checked="form.bot_traits.straight"
                    id="trait_direto"
                  />
                  <label for="trait_direto" class="text-sm">Direto</label>
                </div>
              </div>
            </div>

            <div class="flex flex-col space-y-2 rounded-lg border p-4">
              <Label for="additional_info">Informações adicionais</Label>
              <Textarea
                v-model="form.additional_info"
                id="additional_info"
                placeholder="Informações extras que ajudem a personalizar a interação..."
                class="min-h-[100px]"
              />
            </div>
          </div>

          <div class="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label for="bot_active">Status do Bot</Label>
              <p class="text-sm text-muted-foreground">
                Ative ou desative o Jarbas na plataforma.
              </p>
            </div>
            <Switch
              v-model:model-value="form.bot_active"
              id="bot_active"
              :disabled="pendingFeedback"
              @update:model-value="handleSwitchChange"
            />
          </div>
          <div v-if="pendingFeedback" class="text-sm text-yellow-600">
            Você precisa responder o feedback abaixo para reativar o bot.
          </div>
        </div>
      </div>

      <div v-if="pendingFeedback" class="mb-8">
        <Separator class="mb-6" />
        <h4 class="text-md font-medium mb-4">Feedback do Último Período</h4>
        <div class="space-y-4">
          <div class="flex flex-col space-y-2 rounded-lg border p-4">
            <Label>Avaliação</Label>
            <div class="flex items-center gap-2">
              <Button
                v-for="rating in [1, 2, 3, 4, 5]"
                :key="rating"
                type="button"
                variant="outline"
                size="sm"
                :class="
                  feedbackForm.rating === rating
                    ? 'bg-primary text-primary-foreground'
                    : ''
                "
                @click="feedbackForm.rating = rating"
              >
                {{ rating }}
              </Button>
            </div>
            <p class="text-sm text-muted-foreground">
              Avalie de 1 a 5 sua experiência com o Jarbas na última semana.
            </p>
          </div>

          <div class="flex flex-col space-y-2 rounded-lg border p-4">
            <Label>O bot ajudou você durante a semana?</Label>
            <RadioGroup v-model="feedbackForm.was_helpful" class="flex gap-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="true" id="help-yes" />
                <Label for="help-yes">Sim</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="false" id="help-no" />
                <Label for="help-no">Não</Label>
              </div>
            </RadioGroup>
          </div>

          <div class="flex flex-col space-y-2 rounded-lg border p-4">
            <Label for="suggestions">Sugestões para melhorar o Jarbas</Label>
            <Textarea
              v-model="feedbackForm.suggestions"
              id="suggestions"
              placeholder="O que podemos melhorar no Jarbas?"
              class="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <Separator class="mb-6" />

      <div class="mb-8">
        <h4 class="text-md font-medium mb-4">Histórico de Feedbacks</h4>
        <div class="rounded-lg border p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>O bot ajudou?</TableHead>
                <TableHead>Sugestões</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="feedback in feedbackHistory" :key="feedback.id">
                <TableCell>{{
                  formatWeekPeriod(feedback.created_at)
                }}</TableCell>
                <TableCell>
                  <div class="flex items-center">
                    <span class="mr-1">{{ feedback.rating }}/5</span>
                    <div class="flex">
                      <Star
                        v-for="i in 5"
                        :key="i"
                        class="h-4 w-4"
                        :class="
                          i <= feedback.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        "
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>{{
                  feedback.was_helpful ? "Sim" : "Não"
                }}</TableCell>
                <TableCell class="max-w-[200px] truncate">{{
                  feedback.suggestions
                }}</TableCell>
              </TableRow>
              <TableRow v-if="feedbackHistory.length === 0">
                <TableCell colspan="4" class="text-center py-4"
                  >Nenhum feedback registrado ainda.</TableCell
                >
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div class="flex gap-2 justify-start mt-4">
        <Button type="submit" :disabled="loading">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          Salvar Configurações
        </Button>
        <Button
          v-if="pendingFeedback"
          type="button"
          @click="submitFeedback"
          :disabled="feedbackLoading || !feedbackForm.rating"
        >
          <Loader2 v-if="feedbackLoading" class="mr-2 h-4 w-4 animate-spin" />
          Enviar Feedback e Reativar Bot
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2, Star } from "lucide-vue-next";
import moment from "moment";
import "moment/locale/pt-br";
import Jarbas from "@/services/jarbas";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspaceStore } from "@/stores/workspace";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const feedbackLoading = ref(false);
const feedbackHistory = ref<
  Array<{
    id: number;
    created_at: string;
    rating: number;
    was_helpful: boolean;
    suggestions: string;
  }>
>([]);
const pendingFeedback = ref(false);
const activeGroupProject = workspaceStore.activeGroupProject;

const form = ref({
  whatsapp_number: "",
  bot_active: false,
  user_name: "",
  user_role: "",
  bot_traits: {
    kind: true,
    funny: false,
    professional: true,
    straight: false,
  },
  additional_info: "",
  deactivation_message:
    "O bot Jarbas foi desativado. Para reativar, acesse a plataforma Elevate.",
});

const formattedWhatsappNumber = computed({
  get: () => {
    const num = form.value.whatsapp_number;
    if (!num) return "";

    return `+${num.substring(0, 2)} ${num.substring(2, 4)} ${num.substring(
      4,
      9
    )}-${num.substring(9)}`
      .replace(/\s$/, "")
      .replace(/-$/, "");
  },
  set: (value) => {
    form.value.whatsapp_number = value.replace(/\D/g, "");
  },
});

const formatWhatsappNumber = (e) => {
  let value = e.target.value.replace(/\D/g, "");

  let formatted = "";
  if (value.length > 0) {
    formatted = `+${value.substring(0, 2)}`;
    if (value.length > 2) {
      formatted += ` (${value.substring(2, 4)}`;
      if (value.length > 4) {
        formatted += `) ${value.substring(4, 9)}`;
        if (value.length > 9) {
          formatted += `-${value.substring(9, 13)}`;
        }
      }
    }
  }

  e.target.value = formatted;
  form.value.whatsapp_number = value;
};

const feedbackForm = ref({
  rating: null as number | null,
  was_helpful: null as string | null,
  suggestions: "",
});

const handleSwitchChange = (value: boolean) => {
  form.value.bot_active = value;
};

const formatWeekPeriod = (dateString: string) => {
  const date = moment(dateString);
  const startOfWeek = date.clone().startOf("week");
  const endOfWeek = date.clone().endOf("week");
  return `Semana ${startOfWeek.format("DD")}-${endOfWeek.format("DD/MM/YYYY")}`;
};

const loadConfig = async () => {
  try {
    if (!activeGroupProject?.project_id) {
      throw new Error("Project ID não encontrado");
    }

    loading.value = true;
    const response = await Jarbas.getConfig(activeGroupProject.id);

    form.value = {
      ...response.data.config,
      bot_traits: response.data.config.bot_traits || {
        kind: false,
        funny: false,
        professional: false,
        straight: false,
      },
    };

    feedbackHistory.value = response.data.feedbackHistory || [];
    pendingFeedback.value = response.data.hasPendingFeedback || false;
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    toast({
      title: "Erro",
      description:
        error instanceof Error
          ? error.message
          : "Falha ao carregar as configurações.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  if (pendingFeedback.value) {
    toast({
      title: "Atenção",
      description:
        "Você precisa responder o feedback pendente antes de salvar as configurações.",
      variant: "warning",
    });
    return;
  }

  try {
    if (!activeGroupProject?.project_id) {
      throw new Error("Project ID não encontrado");
    }

    loading.value = true;
    await Jarbas.updateConfig(activeGroupProject.id, form.value);

    toast({
      title: "Sucesso",
      description: "Configurações do Jarbas atualizadas com sucesso.",
      variant: "success",
    });
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    toast({
      title: "Erro",
      description:
        error instanceof Error
          ? error.message
          : "Falha ao atualizar as configurações.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const submitFeedback = async () => {
  if (!feedbackForm.value.rating) {
    toast({
      title: "Atenção",
      description: "Por favor, forneça uma avaliação.",
      variant: "warning",
    });
    return;
  }

  if (!activeGroupProject?.project_id) {
    toast({
      title: "Erro",
      description: "Project ID não encontrado",
      variant: "destructive",
    });
    return;
  }

  try {
    feedbackLoading.value = true;
    await Jarbas.reactivateWithFeedback(activeGroupProject.id, {
      ...feedbackForm.value,
      was_helpful: feedbackForm.value.was_helpful === "true",
    });

    toast({
      title: "Sucesso",
      description: "Feedback enviado e bot reativado com sucesso!",
      variant: "success",
    });

    await loadConfig();
    feedbackForm.value = { rating: null, was_helpful: null, suggestions: "" };
  } catch (error) {
    console.error("Erro ao enviar feedback:", error);
    toast({
      title: "Erro",
      description:
        error instanceof Error ? error.message : "Falha ao enviar o feedback.",
      variant: "destructive",
    });
  } finally {
    feedbackLoading.value = false;
  }
};

onMounted(async () => {
  try {
    if (activeGroupProject?.type === "group") {
      throw new Error(
        "Para acessar o Jarbas BOT é necessário que a workspace seja um projeto."
      );
    }

    moment.locale("pt-br");
    await loadConfig();
  } catch (error) {
    console.error("Erro na inicialização:", error);
    toast({
      title: "Erro",
      description:
        error instanceof Error
          ? error.message
          : "Erro ao carregar as configurações do Jarbas BOT.",
      variant: "destructive",
    });
  }
});
</script>

<style scoped>
.flex.items-center.space-x-2 {
  margin-bottom: 0.5rem;
}
</style>
