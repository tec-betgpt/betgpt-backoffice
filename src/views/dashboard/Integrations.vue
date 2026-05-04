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
      <Card v-for="data in integrations" :key="data.id" class="p-5 relative">
        <Button
          variant="ghost"
          size="icon"
          class="absolute top-3 right-3 h-8 w-8"
          @click="openPreferencesDialog(data)"
          :title="`Preferências do ${data.name}`"
        >
          <Settings2 class="h-4 w-4" />
        </Button>
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
          v-if="data.slug === 'google-analytics' && propetyList.length > 0"
          class="mt-4"
        >
          <Label for="property" class="mb-1">Propriedade do Projeto</Label>
          <Select id="property" v-model="propetySelect" class="my-1">
            <SelectTrigger>
              <SelectValue placeholder="Selecione a propriedade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="property in propetyList"
                :key="property.id"
                :value="property.id"
              >
                {{ property.name }}/{{ property.id.replace("properties/", "") }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          v-if="data.slug === 'meta' && adAccountMeta.length > 0"
          class="mt-4"
        >
          <Label for="property" class="mb-1">Propriedade do Projeto</Label>
          <Select id="property" v-model="adAccountSelect" class="my-1">
            <SelectTrigger>
              <SelectValue placeholder="Selecione a propriedade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-if="data.slug === 'meta'"
                v-for="account in adAccountMeta"
                :key="account.id"
                :value="account.id"
              >
                {{ account.name }}/{{ account.id }}
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
        <div
          class="mt-4 text-sm"
          v-if="data.slug === 'meta' && data.config?.ad_account"
        >
          <span>
            Propriedade vinculada:
            {{
              data.config?.ad_account ? data.config.ad_account : "Não conectado"
            }}
          </span>
        </div>
        <div class="mt-4 space-y-4">
          <template v-for="field in data.fields" :key="field.key">
          <div
            v-if="shouldShowField(field, data)"
            class="space-y-2"
          >
            <template v-if="field.type === 'string'">
              <Label :for="`${data.slug}-${field.key}`">{{ field.title }}</Label>
              <Input
                :id="`${data.slug}-${field.key}`"
                v-model="data.config[field.key]"
                :placeholder="field.description"
              />
            </template>

            <template v-else-if="field.type === 'boolean'">
              <div class="flex flex-col space-y-1">
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    :id="`${data.slug}-${field.key}`"
                    v-model="data.config[field.key]"
                  />
                  <span class="text-sm font-medium">
                    {{ field.title || "Sincronizar usuários" }}
                  </span>
                </div>
                <p
                  v-if="field.description"
                  class="text-xs text-muted-foreground ml-6"
                >
                  {{ field.description }}
                </p>
              </div>
            </template>

            <template v-else-if="field.type === 'url'">
              <Label :for="`${data.slug}-${field.key}`">{{ field.title }}</Label>
              <Button
                :id="`${data.slug}-${field.key}`"
                :disabled="disableBt"
                @click="
                  data.config?.email
                    ? confirmLogout(data.integration.integration_id)
                    : initOAuth2(field.description, data.id)
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
            </template>
          </div>
        </template>
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

    <AlertDialog
      :open="isLogoutDialogOpen"
      @update:open="isLogoutDialogOpen = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deseja realmente desconectar?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao desconectar esta integração, o acesso aos dados será interrompido
            até que um novo login seja realizado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isLogoutDialogOpen = false"
            >Cancelar</AlertDialogCancel
          >
          <AlertDialogAction
            @click="handleLogoutConfirm"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar Desconexão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <IntegrationPreferencesGoogleAnalytics
      :open="preferencesDialogOpen"
      :integration-id="googleAnalyticsIntegrationId"
      :project-id="googleAnalyticsProjectId"
      @update:open="preferencesDialogOpen = $event"
      @save="fetchIntegrations"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useScreenContext } from "@/composables/useScreenContext";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Loader2 as LucideSpinner,
  ExternalLink,
  LogOut,
} from "lucide-vue-next";
import Projects from "@/services/projects";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import IAAnaliseButton from "@/components/custom/IAAnaliseButton.vue";
import IntegrationPreferencesGoogleAnalytics from "@/views/dashboard/IntegrationPreferencesGoogleAnalytics.vue";
import { Settings2 } from "lucide-vue-next";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const saving = ref(false);
const integrations = ref<Array<any>>([]);
const activeGroupProject = workspaceStore.activeGroupProject;
const popUp = ref<Window | null>(null);
const propetyList = ref<Array<{ id: string; name: string }>>([]);
const propetySelect = ref("");
const adAccountSelect = ref("");
const adAccountMeta = ref<Array<{ id: string; name: string }>>([]);
const disableBt = ref(false);
const preferencesDialogOpen = ref(false);
const googleAnalyticsIntegrationId = ref<number | undefined>();
const googleAnalyticsProjectId = ref<string | undefined>();

const openPreferencesDialog = (integration: any) => {
  if (integration.slug === "google-analytics") {
    googleAnalyticsIntegrationId.value = integration.id;
    googleAnalyticsProjectId.value = activeGroupProject.id;
    preferencesDialogOpen.value = true;
  }
};

const isLogoutDialogOpen = ref(false);
const integrationIdToLogout = ref(null);

function confirmLogout(id: any) {
  integrationIdToLogout.value = id;
  isLogoutDialogOpen.value = true;
}

async function handleLogoutConfirm() {
  if (integrationIdToLogout.value) {
    await logoutOAuth2(integrationIdToLogout.value);
  }
  isLogoutDialogOpen.value = false;
  integrationIdToLogout.value = null;
}

async function fetchIntegrations() {
  loading.value = true;

  try {
    if (activeGroupProject.type == "group") {
      throw new Error(
        "Para acessar as fontes de dados é necessário que a workspace seja um projeto.",
      );
    }

    const { data } = await Projects.integrations(activeGroupProject.project_id);

    integrations.value = data.map((integration: any) => {
      const rawConfig = integration.integration?.config;

      const configFixed =
        Array.isArray(rawConfig) || !rawConfig ? {} : rawConfig;

      return {
        ...integration,
        config: configFixed,
      };
    });
    const google = integrations.value.find(
      (value) => value.slug === "google-analytics",
    );
    const meta = integrations.value.find((value) => value.slug === "meta");
    if (google) {
      if (google.config !== null) {
        if (google.config.property_id == "" || google.config.property_id == null) {
          await getProperty();
        }
      }
    }
    if (meta) {
      if (meta.config) {
        if (meta.config.ad_account == "") {
          await getAccountIdMeta();
        }
      }
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as fontes de dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
}

async function initOAuth2(url: string, id: number) {
  //window.open(url, "_blank", "width=500,height=600");
  disableBt.value = true;
  const response = await api.get(url, {
    params: {
      project_id: activeGroupProject.project_id,
      integration_id: id,
    },
  });
  popUp.value = window.open(
    response.data.data.url,
    "_blank",
    "width=500,height=600,scrollbars=yes",
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
      (value) => value.slug === "google-analytics",
    ).id,
  });
}

async function getAccountIdMeta() {
  adAccountMeta.value = await Projects.adAccount({
    project_id: activeGroupProject.project_id,
    integration_id: integrations.value.find((value) => value.slug === "meta")
      .id,
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

function shouldShowField(field: any, integration: any) {
  if (!field.depends_on) {
    return true;
  }

  const dependsValue = integration?.config?.[field.depends_on];

  if (dependsValue === null || dependsValue === undefined) {
    return false;
  }

  if (typeof dependsValue === "string") {
    return dependsValue.trim() !== "";
  }

  if (Array.isArray(dependsValue)) {
    return dependsValue.length > 0;
  }

  return Boolean(dependsValue);
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

    case "Call4U":
      return {
        logo: "/third-party/call4u.png",
        brief:
          "Solução de telefonia para automação de ligações, atendimento e engajamento com clientes.",
      };

    case "Smartico":
      return {
        logo: "/third-party/smartico.png",
        brief:
          "Plataforma de CRM e automação de marketing.",
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
  if (propetySelect.value) {
    integrations.value[1].config.property_id = propetySelect.value;
    integrations.value[1].config.property_name = propetyList.value.find(
      (property) => property.id === propetySelect.value,
    ).name;
  }
  if (adAccountSelect.value) {
    integrations.value[3].config.ad_account = adAccountSelect.value;
  }
  try {
    await Projects.bulkUpdate(
      activeGroupProject.project_id,
      integrations.value,
    );

    toast({
      title: "Sucesso",
      description: "Fontes de Dados salvas com sucesso.",
    });
    propetyList.value = [];
  } catch (error) {
    console.error(error);
    toast({
      title: "Erro",
      description: "Erro ao carregar as Fontes de Dados.",
      variant: "destructive",
    });
  }

  saving.value = false;
  await fetchIntegrations();
}

onMounted(async () => {
  await fetchIntegrations();
});

useScreenContext(
  "Tela de integrações - Gerencia integrações com serviços externos",
  () => ({
    "property_id": propetySelect.value || "Não selecionada",
    "ad_account": adAccountSelect.value || "Não selecionada",
  }),
  "/v1/projects/integrations"
);
</script>
