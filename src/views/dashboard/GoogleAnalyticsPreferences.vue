<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Settings2, Check, Plus } from "lucide-vue-next";
import ProjectPreferences from "@/services/projectPreferences";
import GoogleAnalytics from "@/services/googleAnalytics";
import { toast } from "@/components/ui/toast";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const saving = ref(false);

const groups = ref<Array<{ id: number; name: string; nickname?: string }>>([]);
const selectedGroup = ref<number | string>("");

const measurements = ref<Array<[string, string]>>([]);
const selectedMeasurement = ref<string>("");

const keyEvents = ref<Array<{ event_name: string; countingMethod: number; name: string }>>([]);
const selectedKeyEvents = ref<Array<{ event: string; type: string }>>([]);

const measurementSecrets = ref<Array<{ name: string; displayName: string; secret: string }>>([]);
const selectedSecret = ref<string>("");

const showCreateEventDialog = ref(false);
const newEventName = ref("");
const creatingEvent = ref(false);

const showCreateSecretDialog = ref(false);
const newSecretName = ref("");
const newSecretDisplayName = ref("");
const creatingSecret = ref(false);

const integrationName = "Google Analytics";

const descriptionText = computed(() => {
  return `Selecione um grupo para usar como padrão nas visualizações. Você ainda poderá acessar dados de outros grupos, mas as telas iniciarão com esse grupo selecionado.`;
});

const measurementDescriptionText = computed(() => {
  return `Selecione uma propriedade do Google Analytics para usar nas integrações.`;
});

const keyEventDescriptionText = computed(() => {
  return `Selecione os eventos-chave que deseja monitorar.`;
});

const projectId = computed(() => workspaceStore.activeGroupProject?.id);
const projectIdNumber = computed(() => Number(workspaceStore.activeGroupProject?.project_id));

const loadGroups = async () => {
  loading.value = true;
  try {
    const response = await ProjectPreferences.googleAnalyticsGroups({
      filter_id: projectId.value,
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

const loadMeasurements = async () => {
  loading.value = true;
  try {
    const response = await GoogleAnalytics.getMeasurements({
      project_id: projectIdNumber.value,
    });
    measurements.value = response.data || [];
  } catch (error) {
    console.error("Erro ao carregar measurements:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as propriedades do Google Analytics.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadKeyEvents = async () => {
  loading.value = true;
  try {
    const response = await GoogleAnalytics.getEvents({
      project_id: projectIdNumber.value,
    });
    keyEvents.value = response.data || [];
  } catch (error) {
    console.error("Erro ao carregar keyEvents:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os eventos-chave do Google Analytics.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadMeasurementSecrets = async () => {
  loading.value = true;
  try {
    const response = await GoogleAnalytics.getMeasurementSecrets({
      project_id: projectIdNumber.value,
    });
    measurementSecrets.value = response.data || [];
  } catch (error) {
    console.error("Erro ao carregar secrets:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os secrets do Google Analytics.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const loadCurrentPreference = async () => {
  try {
    const response = await ProjectPreferences.index({
      filter_id: projectId.value,
    });
    if (response) {
      console.log(response.data.google_analytics);
      selectedGroup.value = response.data.google_analytics["google_analytics_group_id"] || "";
      selectedMeasurement.value = response.data.google_analytics.events["google_analytics_measurement_id"] || "";
      selectedSecret.value = response.data.google_analytics["google_analytics_measurement_secret"] || "";

      const eventsData = response.data.google_analytics.events;
      if (eventsData) {
        const savedEvents = eventsData["google_analytics_key_events"];
        if (savedEvents && Array.isArray(savedEvents)) {
          selectedKeyEvents.value = savedEvents;
        } else if (savedEvents && typeof savedEvents === 'string') {
          selectedKeyEvents.value = [];
        }
      }
    } else {
      selectedGroup.value = "";
      selectedMeasurement.value = "";
      selectedKeyEvents.value = [];
      selectedSecret.value = "";
    }
  } catch (error) {
    console.error("Erro ao carregar preferência atual:", error);
    selectedGroup.value = "";
    selectedMeasurement.value = "";
    selectedKeyEvents.value = [];
    selectedSecret.value = "";
  }
};

const toggleKeyEvent = (eventName: string, eventType: string = '') => {
  const index = selectedKeyEvents.value.findIndex(e => e.event === eventName);
  if (index === -1) {
    selectedKeyEvents.value.push({ event: eventName, type: eventType });
  } else {
    selectedKeyEvents.value.splice(index, 1);
  }
};

const isKeyEventSelected = (eventName: string) => {
  return selectedKeyEvents.value.some(e => e.event === eventName);
};

const getEventType = (eventName: string) => {
  const found = selectedKeyEvents.value.find(e => e.event === eventName);
  return found ? found.type : '';
};

const updateEventType = (eventName: string, type: string) => {
  const found = selectedKeyEvents.value.find(e => e.event === eventName);
  if (found) {
    found.type = type;
  }
};

const handleCreateEvent = async () => {
  if (!newEventName.value.trim()) return;

  creatingEvent.value = true;

  try {
    await GoogleAnalytics.createEvent({
      project_id: projectIdNumber.value,
      event_name: newEventName.value.trim(),
    });

    toast({
      title: "Sucesso",
      description: "Evento-chave criado com sucesso.",
    });

    showCreateEventDialog.value = false;
    newEventName.value = "";
    await loadKeyEvents();
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    toast({
      title: "Erro",
      description: "Não foi possível criar o evento-chave.",
      variant: "destructive",
    });
  } finally {
    creatingEvent.value = false;
  }
};

const handleCreateSecret = async () => {
  if (!newSecretName.value.trim() || !newSecretDisplayName.value.trim()) return;

  creatingSecret.value = true;

  try {
    await GoogleAnalytics.createMeasurementSecret({
      project_id: projectIdNumber.value,
    });

    toast({
      title: "Sucesso",
      description: "Secret criado com sucesso.",
    });

    showCreateSecretDialog.value = false;
    newSecretName.value = "";
    newSecretDisplayName.value = "";
    await loadMeasurementSecrets();
  } catch (error) {
    console.error("Erro ao criar secret:", error);
    toast({
      title: "Erro",
      description: "Não foi possível criar o secret.",
      variant: "destructive",
    });
  } finally {
    creatingSecret.value = false;
  }
};

const handleSave = async () => {

  saving.value = true;

  try {
    const payload = {
      project_id: projectIdNumber.value,
      google_analytics: {
        google_analytics_group_id: selectedGroup.value || '' ,
        google_analytics_measurement_secret: selectedSecret.value || '',
        events:
            {
              google_analytics_measurement_id: measurements.value.find(v => v.id == selectedMeasurement.value).id || "",
              google_analytics_key_events: selectedKeyEvents.value || [],
              google_analytics_measurement_dataStreams: measurements.value.find(v => v.id == selectedMeasurement.value).name || "",
            }
      }
    }

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
  await Promise.all([loadCurrentPreference(), loadGroups(), loadMeasurements(), loadKeyEvents(), loadMeasurementSecrets()]);
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

    <div class="space-y-6 py-4 border-t">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2">
        <Label class="text-base font-medium">Propriedade (Measurement)</Label>
        <p class="text-sm text-muted-foreground">
          {{ measurementDescriptionText }}
        </p>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 2" :key="n" class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else-if="measurements.length === 0" class="text-center py-8 text-muted-foreground">
        Nenhuma propriedade disponível para esta integração.
      </div>

      <Select v-else v-model="selectedMeasurement">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecione uma propriedade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="measurement in measurements"
            :key="measurement.id"
            :value="measurement.id"
          >
            {{ measurement.displayName }} ({{ measurement.id }})
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-6 py-4 border-t">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2 flex items-center justify-between">
        <div>
          <Label class="text-base font-medium">Chave Secreta (Measurement Secret)</Label>
          <p class="text-sm text-muted-foreground">
            Selecione um secret para autenticação com a API do Google Analytics.
          </p>
        </div>
        <Button variant="outline" size="sm" @click="showCreateSecretDialog = true">
          <Plus class="h-4 w-4 mr-1" />
          Criar Secret
        </Button>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 2" :key="n" class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else-if="measurementSecrets.length === 0" class="text-center py-8 text-muted-foreground">
        Nenhum secret disponível para esta integração.
      </div>

      <Select v-else v-model="selectedSecret">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Selecione um secret" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="secret in measurementSecrets"
            :key="secret.name"
            :value="secret.name"
          >
            {{ secret.displayName }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-6 py-4 border-t">
      <div class="bg-muted/50 rounded-lg p-4 space-y-2 flex items-center justify-between">
        <div>
          <Label class="text-base font-medium">Eventos-Chave (KeyEvents)</Label>
          <p class="text-sm text-muted-foreground">
            {{ keyEventDescriptionText }}
          </p>
        </div>
        <Button variant="outline" size="sm" @click="showCreateEventDialog = true">
          <Plus class="h-4 w-4 mr-1" />
          Criar Evento
        </Button>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 3" :key="n" class="h-10 bg-muted animate-pulse rounded" />
      </div>

      <div v-else-if="keyEvents.length === 0" class="text-center py-8 text-muted-foreground">
        Nenhum evento-chave disponível para esta integração.
      </div>

<div v-else class="space-y-3">
        <div
          v-for="event in keyEvents"
          :key="event.name"
          class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          :class="isKeyEventSelected(event.name) ? 'border-primary bg-primary/5' : 'border-input'"
        >
          <div class="flex items-center gap-3">
            <Checkbox 
              :checked="isKeyEventSelected(event.name)"
              @update:checked="() => toggleKeyEvent(event.name)"
            />
            <Label class="cursor-pointer font-normal">
              {{ event.event_name }}
            </Label>
          </div>
          <div v-if="isKeyEventSelected(event.name)" class="flex items-center gap-2">
            <Select 
              :modelValue="getEventType(event.name)"
              @update:modelValue="(val) => updateEventType(event.name, val)"
            >
              <SelectTrigger class="w-40 h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="first_deposit">Primeiro Depósito</SelectItem>
                <SelectItem value="saque">Saque</SelectItem>
                <SelectItem value="criacao_conta">Criação de Conta</SelectItem>
              </SelectContent>
            </Select>
            <Check class="h-4 w-4 text-primary" />
          </div>
          <div v-else class="w-44"></div>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <Button @click="handleSave" :disabled="loading || saving">
        <span v-if="saving">Salvando...</span>
        <span v-else>Salvar Preferências</span>
      </Button>
    </div>

    <Dialog v-model:open="showCreateEventDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Evento-Chave</DialogTitle>
          <DialogDescription>
            Crie um novo evento-chave para monitorar no Google Analytics.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="eventName">Nome do Evento</Label>
            <Input
              id="eventName"
              v-model="newEventName"
              placeholder="Ex: purchase, sign_up, first_deposit"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateEventDialog = false">
            Cancelar
          </Button>
          <Button @click="handleCreateEvent" :disabled="!newEventName.trim() || creatingEvent">
            <span v-if="creatingEvent">Criando...</span>
            <span v-else>Criar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showCreateSecretDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Chave Secreta</DialogTitle>
          <DialogDescription>
            Crie uma nova chave secreta para autenticação com a API do Google Analytics.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="secretName">Nome</Label>
            <Input
              id="secretName"
              v-model="newSecretName"
              placeholder="Ex: meu-secret"
            />
          </div>
          <div class="space-y-2">
            <Label for="secretDisplayName">Nome de Exibição</Label>
            <Input
              id="secretDisplayName"
              v-model="newSecretDisplayName"
              placeholder="Ex: Minha Chave Secreta"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateSecretDialog = false">
            Cancelar
          </Button>
          <Button @click="handleCreateSecret" :disabled="!newSecretName.trim() || !newSecretDisplayName.trim() || creatingSecret">
            <span v-if="creatingSecret">Criando...</span>
            <span v-else>Criar</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>