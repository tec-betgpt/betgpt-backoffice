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
    <div v-else class="space-y-6">
      <Card
        v-for="data in integrations"
        :key="data.id"
        class=" rounded-lg p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ data.name }}</p>
            <p class="text-sm text-muted-foreground">
              Configure os campos necessários para habilitar esta integração.
            </p>
          </div>
        </div class="flex items-center justify-between">
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
    <Button class="mt-4" :disabled="saving" @click="saveAllIntegrations">
      <LucideSpinner v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
      Salvar Integrações
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import api from "@/services/api";
import {Card, CardContent} from "@/components/ui/card";

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const loading = ref(false);
const saving = ref(false);
const integrations = ref<Array<any>>([]);
const activeGroupProject = workspaceStore.activeGroupProject;

async function fetchIntegrations() {
  try {
    loading.value = true;

    if (activeGroupProject.type == "group") {
      throw new Error(
        "Para acessar as integrações é necessário que a workspace seja um projeto."
      );
    }

    const { data } = await api.get(
      `/projects/${activeGroupProject.project_id}/integrations`
    );

    integrations.value = data.data.map((integration) => ({
      ...integration,
      config: integration.integration ? integration.integration.config : {},
    }));
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as integrações.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
}

async function saveAllIntegrations() {
  try {
    saving.value = true;
    await api.post(
      `/projects/${activeGroupProject.project_id}/integrations/bulk-update`,
      integrations.value
    );
    toast({
      title: "Sucesso",
      description: "Integrações salvas com sucesso.",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar as integrações.",
      variant: "destructive",
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchIntegrations();
});
</script>
