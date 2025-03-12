<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Integrações do Projeto</h3>
      <p class="text-sm text-muted-foreground">
        Gerencie as integrações do projeto.
      </p>
    </div>

    <Separator class="mb-3" />

    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-full" />
    </div>
    <div v-else class="space-y-6">
      <div
        v-for="integration in integrations"
        :key="integration.id"
        class="border rounded-lg p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ integration.name }}</p>
            <p class="text-sm text-muted-foreground">
              Configure os campos necessários para habilitar esta integração.
            </p>
          </div>
        </div>
        <div class="mt-4 space-y-4">
          <div
            v-for="field in integration.fields"
            :key="field.key"
            class="space-y-2"
          >
            <Label :for="`${integration.slug}-${field.key}`">{{
              field.title
            }}</Label>
            <Input
              :id="`${integration.slug}-${field.key}`"
              v-model="integration.config[field.key]"
              :placeholder="field.description"
            />
          </div>
        </div>
        <Button
          class="mt-4"
          :disabled="savingIntegration[integration.id]"
          @click="saveIntegration(integration)"
        >
          <LucideSpinner
            v-if="savingIntegration[integration.id]"
            class="mr-2 h-4 w-4 animate-spin"
          />
          Salvar Integração
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const savingIntegration = ref<Record<number, boolean>>({});
const integrations = ref<Array<any>>([]);

const fetchIntegrations = async () => {
  try {
    loading.value = true;
    const activeGroupProject = workspaceStore.activeGroupProject;
    if (activeGroupProject.type == "group")
      throw new Error(
        "Para acessar as integrações é necessário que a workspace seja um projeto."
      );

    const integrationsResponse = await api.get("/available-integrations");
    const projectIntegrationsResponse = await api.get(
      `/projects/${activeGroupProject.project_id}/integrations`
    );

    integrations.value = integrationsResponse.data.data.map(
      (integration: any) => {
        const existingConfig =
          projectIntegrationsResponse.data.data.find(
            (pi: any) => pi.integration_id === integration.id
          )?.config || {};

        return {
          ...integration,
          fields: integration.fields,
          config: existingConfig,
        };
      }
    );
  } catch (error) {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const saveIntegration = async (integration: any) => {
  try {
    const projectId = workspaceStore.activeGroupProject?.project_id;
    if (!projectId) throw new Error("Nenhum projeto ativo selecionado.");

    savingIntegration.value[integration.id] = true;

    await api.post(`/projects/${projectId}/integrations/${integration.slug}`, {
      ...integration.config,
    });

    toast({
      title: "Sucesso",
      description: `Integração ${integration.name} salva com sucesso.`,
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: `Erro ao salvar a integração ${integration.name}.`,
      variant: "destructive",
    });
  } finally {
    savingIntegration.value[integration.id] = false;
  }
};

onMounted(fetchIntegrations);
</script>
