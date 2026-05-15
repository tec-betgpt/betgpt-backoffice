<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Check, Plus, Copy, CheckCheck } from "lucide-vue-next";
import ProjectPreferences from "@/services/projectPreferences";
import MetaAds from "@/services/metaAds";
import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const saving = ref(false);

const pixels = ref<Array<{ id: string; name: string; code: string }>>([]);
const selectedPixel = ref<string>("");

const selectedEvents = ref<Array<{ event: string; type: string }>>([]);

const newEventName = ref("");
const newEventType = ref("");

const showCreatePixelDialog = ref(false);
const newPixelName = ref("");
const creatingPixel = ref(false);

const copied = ref(false);

const integrationName = "Meta Ads";

const pixelDescriptionText = computed(() => {
  return `Selecione um pixel para usar nas integrações.`;
});

const eventDescriptionText = computed(() => {
  return `Selecione os eventos que deseja monitorar.`;
});

const projectId = computed(() => workspaceStore.activeGroupProject?.id);
const projectIdNumber = computed(() => Number(workspaceStore.activeGroupProject?.project_id));

const selectedPixelCode = computed(() => {
  const pixel = pixels.value.find(p => p.id === selectedPixel.value);
  return pixel?.code || "";
});

const loadPixels = async () => {
  loading.value = true;
  try {
    const response = await MetaAds.getPixels({
      project_id: projectIdNumber.value,
    });
    pixels.value = response || [];
  } catch (error) {
    console.error("Erro ao carregar pixels:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os pixels da Meta Ads.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadCurrentPreference = async () => {
  try {
    const response = await ProjectPreferences.show(
    projectIdNumber.value
    );
    if (response) {
      selectedPixel.value = response.data.meta_ads?.meta_ads_pixel_id || "";
      
      const savedEvents = response.data.meta_ads?.meta_ads_events;
      if (savedEvents && Array.isArray(savedEvents)) {
        selectedEvents.value = savedEvents;
      }
    } else {
      selectedPixel.value = "";
      selectedEvents.value = [];
    }
  } catch (error) {
    console.error("Erro ao carregar preferência atual:", error);
    selectedPixel.value = "";
    selectedEvents.value = [];
  }
};

const handleCreatePixel = async () => {
  if (!newPixelName.value.trim()) return;

  creatingPixel.value = true;

  try {
    await MetaAds.createPixel({
      project_id: projectIdNumber.value,
      name: newPixelName.value.trim(),
    });

    toast({
      title: "Sucesso",
      description: "Pixel criado com sucesso.",
    });

    showCreatePixelDialog.value = false;
    newPixelName.value = "";
    await loadPixels();
  } catch (error) {
    console.error("Erro ao criar pixel:", error);
    toast({
      title: "Erro",
      description: "Não foi possível criar o pixel.",
      variant: "destructive",
    });
  } finally {
    creatingPixel.value = false;
  }
};

const handleCopyCode = async () => {
  if (!selectedPixelCode.value) return;
  
  try {
    await navigator.clipboard.writeText(selectedPixelCode.value);
    copied.value = true;
    toast({
      title: "Copiado",
      description: "Código do pixel copiado para a área de transferência.",
    });
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Erro ao copiar:", error);
    toast({
      title: "Erro",
      description: "Não foi possível copiar o código.",
      variant: "destructive",
    });
  }
};

const addEvent = () => {
  if (!newEventName.value.trim()) return;
  
  const exists = selectedEvents.value.some(e => e.event === newEventName.value.trim());
  if (exists) {
    toast({
      title: "Aviso",
      description: "Este evento já foi adicionado.",
      variant: "destructive",
    });
    return;
  }

  selectedEvents.value.push({
    event: newEventName.value.trim(),
    type: newEventType.value || ""
  });
  
  newEventName.value = "";
  newEventType.value = "";
};

const removeEvent = (index: number) => {
  selectedEvents.value.splice(index, 1);
};

const handleSave = async () => {

  saving.value = true;
  try {
    const payload = {
      project_id: projectIdNumber.value,
      meta_ads: {
        meta_ads_pixel_id: selectedPixel.value || "",
        meta_ads_events: selectedEvents.value || [],
      }
    };

    await ProjectPreferences.store(payload);

    toast({
      title: "Sucesso",
      description: "Preferências salvas com sucesso.",
    });
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

onMounted(async () => {
  MetaAds.getEvents({project_id: projectIdNumber.value})
  await Promise.all([loadCurrentPreference(), loadPixels()]);
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Settings2 class="h-5 w-5" />
        Preferências do {{ integrationName }}
      </h2>
      <p class="text-muted-foreground">
        Customize as configurações padrões para esta integração.
      </p>
    </div>

    <div class="space-y-6 py-4 border-t">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2 flex items-center justify-between">
        <div>
          <Label class="text-base font-medium">Pixel</Label>
          <p class="text-sm text-muted-foreground">
            {{ pixelDescriptionText }}
          </p>
        </div>
        <Button variant="outline" size="sm" @click="showCreatePixelDialog = true">
          <Plus class="h-4 w-4 mr-1" />
          Criar Pixel
        </Button>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 2" :key="n" class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else-if="pixels.length === 0" class="text-center py-8 text-muted-foreground">
        Nenhum pixel disponível para esta integração.
      </div>

      <Select v-else v-model="selectedPixel">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecione um pixel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="pixel in pixels"
            :key="pixel.id"
            :value="pixel.id"
          >
            {{ pixel.name}}
          </SelectItem>
        </SelectContent>
      </Select>
      
    </div>

    <div class="space-y-6 py-4 border-t">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2">
        <Label class="text-base font-medium">Eventos</Label>
        <p class="text-sm text-muted-foreground">
          {{ eventDescriptionText }}
        </p>
      </div>

      <div class="flex gap-2 items-end">
        <div class="flex-1">
          <Label for="eventName">Nome do Evento</Label>
          <Input
            id="eventName"
            v-model="newEventName"
            placeholder="Ex: purchase, lead"
            class="mt-1"
            @keyup.enter="addEvent"
          />
        </div>
        <div class="w-48">
          <Label for="eventType">Tipo</Label>
          <Select v-model="newEventType">
            <SelectTrigger id="eventType" class="mt-1">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="deposit">Depósito</SelectItem>
              <SelectItem value="first_deposit">Primeiro Depósito</SelectItem>
              <SelectItem value="pendent_deposit">Depósito Pendente</SelectItem>
              <SelectItem value="saque">Saque</SelectItem>
              <SelectItem value="sign_up">Criação de Conta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button @click="addEvent" :disabled="!newEventName.trim()">
          <Plus class="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div v-if="selectedEvents.length === 0" class="text-center py-8 text-muted-foreground">
        Nenhum evento adicionado.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(event, index) in selectedEvents"
          :key="index"
          class="flex items-center justify-between p-3 rounded-lg border border-input"
        >
          <div class="flex items-center gap-3">
            <Label class="font-normal">
              {{ event.event }}
            </Label>
          </div>
          <div class="flex items-center gap-2">
            <Select 
              :modelValue="event.type"
              @update:modelValue="(val) => event.type = val"
            >
              <SelectTrigger class="w-40 h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="first_deposit">Primeiro Depósito</SelectItem>
                <SelectItem value="pendent_deposit">Depósito Pendente</SelectItem>
                <SelectItem value="saque">Saque</SelectItem>
                <SelectItem value="sign_up">Criação de Conta</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" @click="removeEvent(index)">
              ×
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <Button @click="handleSave" :disabled="loading || saving">
        <span v-if="saving">Salvando...</span>
        <span v-else>Salvar Preferências</span>
      </Button>
    </div>

    <Dialog v-model:open="showCreatePixelDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Pixel</DialogTitle>
          <DialogDescription>
            Crie um novo pixel para rastreamento no Meta Ads.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="pixelName">Nome do Pixel</Label>
            <Input
              id="pixelName"
              v-model="newPixelName"
              placeholder="Ex: Meu Pixel"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreatePixelDialog = false">
            Cancelar
          </Button>
          <Button @click="handleCreatePixel" :disabled="!newPixelName.trim() || creatingPixel">
            <span v-if="creatingPixel">Criando...</span>
            <span v-else>Criar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>