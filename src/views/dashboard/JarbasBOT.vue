<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="mb-4 flex sm:flex-row flex-col justify-between items-center align-baseline w-full gap-4">
      <div class="space-y-0.5">
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight">Jarbas BOT</h2>
        <p class="text-muted-foreground">
          Gerencie as preferências de interação, ativação e feedback do Jarbas BOT.
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="ghost" @click="handleActive(botStatusActive)" >
          <Power /><p>{{!botStatusActive?"Desativar":"Ativar"}}</p>
        </Button>
        <Button @click="openSettingsDialog" >
          <Settings2 /> <p>Configuração </p>
        </Button>
      </div>


    </div>
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
          <TableRow
              v-for="feedback in feedbackHistory"
              :key="feedback.id"
          >
            <TableCell>{{
                formatWeekPeriod(feedback.created_at)
              }}</TableCell>
            <TableCell>
              <div class="flex items-center">
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
    <div v-if="pendingFeedback" class="mb-4">
      <Separator class="mb-6" />
      <h4 class="text-md font-medium mb-4">
        Feedback do Último Período
      </h4>
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
            Avalie de 1 a 5 sua experiência com o Jarbas na última
            semana.
          </p>
        </div>

        <div class="flex flex-col space-y-2 rounded-lg border p-4">
          <Label>O bot ajudou você durante a semana?</Label>
          <RadioGroup
              v-model="feedbackForm.was_helpful"
              class="flex gap-4"
          >
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
          <Label for="suggestions"
          >Sugestões para melhorar o Jarbas</Label
          >
          <Textarea
              v-model="feedbackForm.suggestions"
              id="suggestions"
              placeholder="O que podemos melhorar no Jarbas?"
              class="min-h-[100px]"
          />
        </div>
      </div>
    </div>
  </div>
  <Dialog v-model:open="openDialog" >

    <DialogContent>
      <div class="w-full flex flex-col items-center">
        <Settings2 :size="40" />
        <p class="text-lg font-semibold mb-2">
          Configuração {{finish? "Concluída" : ""}}
        </p>
        <p class="text-sm text-muted-foreground mb-4">
        {{finish?"Suas definições serão aplicadas imediatamente.":"Informação"}}
        </p>
      </div>
      <div v-if="step === 1" class="space-y-4">
        <div>
          <Label for="whatsapp">WhatsApp</Label>
          <Input id="whatsapp"  v-model="formattedWhatsappNumber" @input="formatWhatsappNumber" placeholder="+55 (00) 00000-0000" />
        </div>
        <div>
          <Label for="name">Como o Jarbas deve te chamar</Label>
          <Input id="name" v-model="form.user_name" placeholder="Ex: amigo, cliente, parceiro" />
        </div>
      </div>
      <div v-if="step === 2" class="space-y-4">
        <div>
          <Label for="role">Qual sua função?</Label>
          <Input id="role" v-model="form.user_role" placeholder="Ex: vendedor, gerente, atendente" />
        </div>
        <div>

     <div class="space-y-2">
       <p class="text-sm font-semibold">Características do Jarbas</p>
       <div class="flex gap-1 items-center">
         <Checkbox id="trait_kind" v-model:checked="form.bot_traits.kind"/>
         <Label for="trait_kind">Simpático</Label>
       </div>
       <div class="flex gap-1 items-center">
         <Checkbox id="trait_funny" v-model:checked="form.bot_traits.funny"/>
         <Label for="trait_funny">Engraçado</Label>
       </div>
       <div class="flex gap-1 items-center">
         <Checkbox id="trait_professional" v-model:checked="form.bot_traits.professional"/>
         <Label for="trait_professional">Profissional</Label>
       </div>
       <div class="flex gap-1 items-center">
         <Checkbox id="trait_straight" v-model:checked="form.bot_traits.straight"/>
         <Label for="trait_straight">Direto</Label>
       </div>
     </div>
        </div>

      </div>
      <div v-if="step === 3" class="space-y-2">

          <Label for="additional_info">Informações adicionais</Label>
          <Textarea v-model="form.additional_info" class="min-h-[100px]" id="additional_info" placeholder="Informações extras que ajudem a personalizar a interação..." />

      </div>

      <DialogFooter class="flex  mt-8 w-full" >
        <p v-if="step>0"> Etapa {{step}}/{{maxStep}} </p>
        <div class="flex-1" v-if="step>0"/>
        <div>
          <Button variant="outline" v-if="step==1" @click="openDialog = false">Cancelar</Button>
          <Button v-if="step > 1" variant="outline" @click="prevStep">Voltar</Button>
          <Button @click="nextStep" v-if="!finish" class="ml-2">Continuar</Button>
          <Button v-if="finish" @click="openDialog = false" >Fechar</Button>
        </div>

      </DialogFooter>
    </DialogContent>

  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2, ChevronDown, Star , Power,Settings2} from "lucide-vue-next";
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
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const step = ref(1);
const maxStep = ref(3);
const finish = ref(false);
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
const botStatusActive = ref(false);
const openDialog = ref(false);
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

const nextStep = () => {
  if (step.value === 1 && (!formattedWhatsappNumber.value || !form.value.user_name)) {
    toast({
      title: "Atenção",
      description: "Por favor, preencha todos os campos da primeira etapa.",
      variant: "destructive",
    });
    return;
  }

  if (step.value === 2 && !form.value.user_role) {
    toast({
      title: "Atenção",
      description: "Por favor, preencha todos os campos da segunda etapa.",
      variant: "destructive",
    });
    return;
  }

  if (step.value < maxStep.value) {
    step.value++;
  } else {
    step.value = 0;
    finish.value = true;
    submit()

  }
};
const prevStep = () => {
  if (step.value > 1) {
    step.value--;
  }
};
const openSettingsDialog = () => {
  openDialog.value = true;
  step.value = 1;
  finish.value = false;
};
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

    botStatusActive.value = !response.data.config.bot_active;
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
      variant: "destructive",
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
      variant: "default",
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
const handleActive = async (value)=>{
  if (!activeGroupProject?.project_id) {
    toast({
      title: "Erro",
      description: "Project ID não encontrado",
      variant: "destructive",
    });
    return;
  }

  try {
    await Jarbas.updateConfig(activeGroupProject.id, form.value);
    if (form.value.bot_active) {
      toast({
        title: "Sucesso",
        description: "Jarbas BOT ativado com sucesso!",
        variant: "default",
      });
    }else{
      toast({
        title: "Sucesso",
        description: "Jarbas BOT desativado com sucesso!",
        variant: "default",
      });
    }


    await loadConfig();
  } catch (error) {
    console.error("Erro ao ativar Jarbas BOT:", error);
    toast({
      title: "Erro",
      description:
        error instanceof Error ? error.message : "Falha  no Jarbas BOT.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
}
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
