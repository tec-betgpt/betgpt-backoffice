<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2  class="text-2xl font-bold tracking-tight">Integrações do Projeto</h2>
      <p class=" text-muted-foreground">
        Gerencie as integrações do projeto.
      </p>
    </div>


    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-full" />
    </div>

    <div v-else class="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
      <Card v-for="data in integrations" :key="data.id" class="p-5">
        <div class="mb-5">
          <img :src="getApplicationDetail(data.name).logo" class="h-14 w-14 rounded" />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ data.name }}</p>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ getApplicationDetail(data.name).brief }}
            </p>
          </div>
        </div>
        <div class="mt-4 space-y-4">
          <div v-for="field in data.fields" :key="field.key" class="space-y-2">
            <Label :for="`${data.slug}-${data.key}`">{{ field.title }}</Label>
            <Input
              :id="`${data.slug}-${field.key}`"
              v-model="data.config[field.key]"
              :placeholder="field.description"
            />
          </div>
        </div>
      </Card>
    </div>

    <div class="flex justify-end">
      <Button class="bg-yellow-300 mt-4" :disabled="saving" @click="saveAllIntegrations">
        <LucideSpinner v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
        Salvar Integrações
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWorkspaceStore } from '@/stores/workspace';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader2 as LucideSpinner, ExternalLink } from 'lucide-vue-next';
import Projects from '@/services/projects';
import {Card} from "@/components/ui/card";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const saving = ref(false);
const integrations = ref<Array<any>>([]);
const activeGroupProject = workspaceStore.activeGroupProject;

async function fetchIntegrations() {
  loading.value = true;

  try {
    if (activeGroupProject.type == "group") {
      throw new Error(
        "Para acessar as integrações é necessário que a workspace seja um projeto."
      );
    }

    const { data } = await Projects.integrations(activeGroupProject.project_id)

    integrations.value = data.map((integration: any) => ({
      ...integration,
      config: integration.integration ? integration.integration.config : {},
    }));
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as integrações.",
      variant: "destructive",
    });
  }

  loading.value = false;
}

function getApplicationDetail (name: string) {
  switch (name) {
    case 'ActiveCampaign':
      return {
        logo: '/third-party/active-campaign.png',
        brief: 'Com SMS Funnel você divulga seu produto ou serviço em tempo-real para todo Brasil e todas as operadoras'
      }

    case 'Google Analytics':
      return {
        logo: '/third-party/google-analytics.png',
        brief: 'Ferramenta para analise de desempenho de sites e apps, otimizando o marketing e a experiência do usuário.'
      }

    case 'SMS Funnel':
      return {
        logo: '/third-party/sms-funnel.png',
        brief: 'E-mail marketing, automação de marketing, vendas e funcionalidade de CRM.'
      }

    default:
      return {
        logo: '/third-party/unknown-app.png',
        brief: 'Configure os campos necessários para habilitar esta integração.'
      }
  }
}

async function saveAllIntegrations() {
  saving.value = true;

  try {
    await Projects.bulkUpdate(activeGroupProject.project_id, integrations.value)

    toast({
      title: "Sucesso",
      description: "Integrações salvas com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as integrações.",
      variant: "destructive",
    });
  }

  saving.value = false;
}

onMounted(async () => {
  await fetchIntegrations();
});
</script>
