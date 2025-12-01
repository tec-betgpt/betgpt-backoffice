<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">
        Fontes de Dados do Projeto
      </h2>
      <p class="text-muted-foreground">
        Gerencie as fontes de dados do projeto.
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-full" />
    </div>

    <div v-else class="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
      <Card v-for="data in integrations" :key="data.id" class="p-5">
        <div class="mb-5">
          <img
            :src="getApplicationDetail(data.name).logo"
            class="h-14 w-14 rounded"
            alt="Logo integration"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ data.name }}</p>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ getApplicationDetail(data.name).brief }}
            </p>
          </div>
        </div>
        <div
          v-if="(data.slug === 'google-analytics' || data.slug === 'meta') && ( propetyList.length > 0 || adAccountMeta.length > 0)"
          class="mt-4"
        >
          <Label for="property" class="mb-1">Propriedade do Projeto</Label>
          <Select id="property" :v-model="data.slug === 'google-analytics' ? data.config.property_id : data.config.ad_account" class="my-1">
            <SelectTrigger>
              <SelectValue placeholder="Selecione a propriedade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="property in propetyList"
                :key="property.id"
                :value="property.id"
              >
                {{ property.name }}/{{ property.id }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          class="mt-4 text-sm"
          v-if="data.slug === 'google-analytics' && data.config?.property_name"
        >
          <span>
            Propriedade vinculada:
            {{
              data.config?.property_name
                ? data.config.property_name
                : "Não conectado"
            }}
          </span>
        </div>
        <div class="mt-4 space-y-4">
          <div v-for="field in data.fields" :key="field.key" class="space-y-2">
            <Label :for="`${data.slug}-${data.key}`">{{ field.title }}</Label>
            <Input
              v-if="field.type === 'string'"
              :id="`${data.slug}-${field.key}`"
              v-model="data.config[field.key]"
              :placeholder="field.description"
            />
            <Button
              :id="`${data.slug}-${field.key}`"
              v-if="field.type === 'url'"
              :disabled="disableBt"
              @click="
                data.config?.email
                  ? logoutOAuth2(data.integration.integration_id)
                  : initOAuth2(field.description,data.id)
              "
            >
              <div
                v-if="data.config?.email"
                class="flex items-center justify-between"
              >
                <LogOut class="mr-2 h-4 w-4" />
                Desconectar
              </div>
              <div v-else class="flex items-center justify-between">
                <ExternalLink class="mr-2 h-4 w-4" />
                Conectar
              </div>
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <div class="flex justify-end">
      <Button
        class="bg-yellow-300 mt-4"
        :disabled="saving"
        @click="saveAllIntegrations"
      >
        <LucideSpinner v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
        Salvar
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Loader2 as LucideSpinner,
  ExternalLink,
  LogOut,
} from "lucide-vue-next";
import Projects from "@/services/projects";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/services/base";
import Integrations from "@/views/dashboard/Integrations.vue";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const saving = ref(false);
const integrations = ref<Array<any>>([]);
const activeGroupProject = workspaceStore.activeGroupProject;
const popUp = ref<Window | null>(null);
const propetyList = ref<Array<{ id: string; name: string }>>([]);
const adAccountMeta = ref<Array<{ id: string; name: string }>>([]);
const disableBt = ref(false);

async function fetchIntegrations() {
  loading.value = true;

  try {
    if (activeGroupProject.type == "group") {
      throw new Error(
        "Para acessar as fontes de dados é necessário que a workspace seja um projeto."
      );
    }

    const { data } = await Projects.integrations(activeGroupProject.project_id);

    integrations.value = data.map((integration: any) => ({
      ...integration,
      config: integration.integration ? integration.integration.config : [],
    }));
    const google = integrations.value.find(
      (value) => value.slug === "google-analytics"
    );
    const meta = integrations.value.find(
        (value) => value.slug === "meta"
    );
    if (google) {
      if (google.config !== null) {
        if (google.config.property_id == "") {
          await getProperty();
        }
      }
    }
  if (meta) {
    if (meta.config !== null) {
      if (meta.config.ad_account == "") {
        await getAccountIdMeta();
      }
    }
  }
  } catch (error) {
    console.log(error);
    toast({
      title: "Erro",
      description: "Erro ao carregar as fontes de dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
}

async function initOAuth2(url: string,id:number) {
  //window.open(url, "_blank", "width=500,height=600");
  disableBt.value = true;
  const response = await api.get(url, {
    params: {
      project_id: activeGroupProject.project_id,
      integration_id: id
    },
  });
  popUp.value = window.open(
    response.data.data.url,
    "_blank",
    "width=500,height=600,scrollbars=yes"
  );
  const timer = setInterval(async () => {
    if (popUp.value.closed) {
      clearInterval(timer);
      await fetchIntegrations();
      disableBt.value = false;
      return;
    }
  }, 500);
}

async function getProperty() {
  propetyList.value = await Projects.property({
    project_id: activeGroupProject.project_id,
    integration_id: integrations.value.find(
      (value) => value.slug === "google-analytics"
    ).id,
  });
}

async function getAccountIdMeta(){
  adAccountMeta.value = await Projects.adAccount({
    project_id: activeGroupProject.project_id,
    integration_id: integrations.value.find(
        (value) => value.slug === "meta"
    ).id,
  });
}

async function logoutOAuth2(id) {
  disableBt.value = true;

  await Projects.logoutOAuth({
    project_id: activeGroupProject.project_id,
    integration_id: id,
  });
  await fetchIntegrations();
  disableBt.value = false;
}

function getApplicationDetail(name: string) {
  switch (name) {
    case "ActiveCampaign":
      return {
        logo: "/third-party/active-campaign.png",
        brief:
          "Com SMS Funnel você divulga seu produto ou serviço em tempo-real para todo Brasil e todas as operadoras",
      };

    case "Google Analytics":
      return {
        logo: "/third-party/google-analytics.png",
        brief:
          "Ferramenta para analise de desempenho de sites e apps, otimizando o marketing e a experiência do usuário.",
      };

    case "Meta":
      return {
        logo: "/third-party/meta.png",
        brief:
            "Ferramenta para analise de desempenho de sites e apps da Meta, otimizando o marketing e a experiência do usuário.",
      };

    case "SMS Funnel":
      return {
        logo: "/third-party/sms-funnel.png",
        brief:
          "E-mail marketing, automação de marketing, vendas e funcionalidade de CRM.",
      };

    default:
      return {
        logo: "/third-party/unknown-app.png",
        brief:
          "Configure os campos necessários para habilitar esta integração.",
      };
  }
}

async function saveAllIntegrations() {
  saving.value = true;

  integrations.value.forEach((integration) => {
    if (
      propetyList.value.length > 0 &&
      integration.slug === "google-analytics"
    ) {
      const selectedProperty = propetyList.value.find(
        (property) => property.id === integration.config.property_id
      );
      integration.config.property_name = selectedProperty
        ? selectedProperty.name
        : "";
    }
  });

  try {
    await Projects.bulkUpdate(
      activeGroupProject.project_id,
      integrations.value
    );

    toast({
      title: "Sucesso",
      description: "Fontes de Dados salvas com sucesso.",
    });
    propetyList.value = [];
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as Fontes de Dados.",
      variant: "destructive",
    });
  }

  saving.value = false;
}

onMounted(async () => {
  await fetchIntegrations();
});
</script>
