<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings2 } from "lucide-vue-next";
import ProjectPreferencesService from "@/services/projectPreferences";
import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const saving = ref(false);
const slug = ref("");

const projectIdNumber = computed(() => Number(workspaceStore.activeGroupProject?.project_id));

const loadCurrentPreference = async () => {
  loading.value = true;
  try {
    const response = await ProjectPreferencesService.show(projectIdNumber.value);
    if (response?.data?.slug) {
      slug.value = response.data.slug;
    } else {
      slug.value = "";
    }
  } catch (error) {
    console.error("Erro ao carregar preferências do projeto:", error);
    slug.value = "";
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const payload = {
      project_id: projectIdNumber.value,
      slug: slug.value.trim(),
    };

    await ProjectPreferencesService.store(payload);

    toast({
      title: "Sucesso",
      description: "Preferências do projeto salvas com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao salvar preferências do projeto:", error);
    toast({
      title: "Erro",
      description: "Não foi possível salvar as preferências do projeto.",
      variant: "destructive",
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await loadCurrentPreference();
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Settings2 class="h-5 w-5" />
        Preferências do Projeto
      </h2>
      <p class="text-muted-foreground">
        Configure as preferências gerais do projeto.
      </p>
    </div>

    <div class="space-y-6 py-4">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2">
        <Label class="text-base font-medium">Slug do Projeto</Label>
        <p class="text-sm text-muted-foreground">
          Identificador amigável usado em outras partes do sistema. Use apenas letras maiúsculas.
        </p>
      </div>

      <div v-if="loading">
        <div class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else class="space-y-2">
        <Input
          id="slug"
          v-model="slug"
          placeholder="Ex: EVL"
        />
      </div>
    </div>

    <div class="flex gap-2">
      <Button @click="handleSave" :disabled="loading || saving">
        <span v-if="saving">Salvando...</span>
        <span v-else>Salvar Preferências</span>
      </Button>
    </div>
  </div>
</template>
