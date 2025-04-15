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
        v-for="data in integrations"
        :key="data.id"
        class="border rounded-lg p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ data.name }}</p>
            <p class="text-sm text-muted-foreground">
              Configure os campos necessários para habilitar esta integração.
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
      </div>
    </div>
    <Button class="mt-4" :disabled="saving" @click="saveAllIntegrations">
      <LucideSpinner v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
      Salvar Integrações
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner } from "lucide-vue-next";
import Projects from "@/services/projects";

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

    const { data } = await Projects.getProjectIntegrations(activeGroupProject.project_id)

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

async function saveAllIntegrations() {
  saving.value = true;

  try {
    await Projects.bulkUpdateProjectIntegrations(activeGroupProject.project_id, integrations.value)

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
  }

  saving.value = false;
}

onMounted(async () => {
  await fetchIntegrations();
});
</script>
