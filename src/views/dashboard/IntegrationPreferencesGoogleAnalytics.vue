<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Settings2 } from "lucide-vue-next";
import ProjectPreferences from "@/services/projectPreferences";
import { toast } from "@/components/ui/toast";

const props = defineProps<{
  open: boolean;
  integrationId?: number;
  projectId?: string;
}>();

const emit = defineEmits(["update:open", "save"]);

const selectedGroup = ref<number | string>("");
const loading = ref(false);
const saving = ref(false);

const groups = ref<Array<{ id: number; name: string; nickname?: string }>>([]);
const integrationName = "Google Analytics";

const descriptionText = computed(() => {
  return `Selecione um grupo para usar como padrão nas visualizações. Você ainda poderá acessar dados de outros grupos, mas as telas iniciarão com esse grupo selecionado.`;
});

const loadGroups = async () => {
  loading.value = true;
  try {
    const response = await ProjectPreferences.googleAnalyticsGroups({
      filter_id: props.projectId,
    });
    groups.value = response.data || [];
  } catch (error) {
    console.error("Erro ao carregar grupos:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os grupos do Google Analytics.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadCurrentPreference = async () => {
  try {
    const response = await ProjectPreferences.index({
      filter_id: props.projectId,
    });
    if (response) {
      selectedGroup.value =  response.data.google_analytics_group_id;
    } else {
      selectedGroup.value = "";
    }
  } catch (error) {
    console.error("Erro ao carregar preferência atual:", error);
    selectedGroup.value = "";
  }
};

const gaNicknameStorageKey = "ga_channel_group_nickname";

const handleSave = async () => {
  if (!selectedGroup.value) return;

  saving.value = true;

  try {
    const payload = {
      project_id: Number(props.projectId),
      google_analytics_group_id: Number(selectedGroup.value),
    };

    const response = await ProjectPreferences.store(payload);

    toast({
      title: "Sucesso",
      description: "Preferências salvas com sucesso.",
    });

    emit("save");
    emit("update:open", false);
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    toast({
      title: "Erro",
      description: "Não foi possível salvar as preferências.",
      variant: "destructive",
    });
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit("update:open", false);
};

watch(() => props.open, async (newVal) => {
  if (newVal) {
    await loadCurrentPreference();
    await loadGroups();
  }
});

onMounted(async () => {
  if (props.open) {
    await loadCurrentPreference();
    await loadGroups();
  }
});
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings2 class="h-5 w-5" />
          Preferências do {{ integrationName }}
        </DialogTitle>
        <DialogDescription>
          Customize as configurações padrão para esta integração.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="bg-muted/50 rounded-lg p-4 space-y-2">
          <Label class="text-base font-medium">Grupo Padrão</Label>
          <p class="text-sm text-muted-foreground">
            {{ descriptionText }}
          </p>
        </div>

        <div v-if="loading" class="space-y-3">
          <div v-for="n in 3" :key="n" class="h-10 bg-muted animate-pulse rounded" />
        </div>

        <div v-else-if="groups.length === 0" class="text-center py-8 text-muted-foreground">
          Nenhum grupo disponível para esta integração.
        </div>

        <RadioGroup v-else v-model="selectedGroup" class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.id"
            class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            :class="selectedGroup === group.id ? 'border-primary bg-primary/5' : 'border-input'"
            @click="selectedGroup = group.id"
          >
            <div class="flex items-center gap-3">
              <RadioGroupItem :value="group.id" :id="String(group.id)" />
              <Label :for="String(group.id)" class="cursor-pointer font-normal">
                {{ group.nickname }}
              </Label>
            </div>
            <Check v-if="selectedGroup === group.id" class="h-4 w-4 text-primary" />
          </div>
        </RadioGroup>
      </div>

      <DialogFooter class="sm:justify-between gap-2">
        <Button variant="outline" @click="handleClose">
          Cancelar
        </Button>
        <Button @click="handleSave" :disabled="!selectedGroup || loading || saving">
          <span v-if="saving">Salvando...</span>
          <span v-else>Salvar Preferências</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>