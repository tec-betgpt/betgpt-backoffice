<template>
  <Button @click="openModal()">
    <PlusIcon class="mr-2 h-4 w-4"/>
    Nova
  </Button>

  <Dialog :open="modal" @update:open="modal = false">
    <DialogContent class="sm:max-w-2xl max-h-[60vw] overflow-y-scroll">
      <DialogHeader>
        <DialogTitle>
          Nova Definição de Conversão
        </DialogTitle>
        <DialogDescription>
          Defina as regras para sua definição de conversão.
        </DialogDescription>
      </DialogHeader>

      <ErrorComponent :errors="errors" />

      <div class="grid gap-6 p-4">
        <!-- Campos Principais -->
        <div class="space-y-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nome</Label>
            <Input
              id="name"
              v-model="form.name"
              placeholder="Ex: Compra Finalizada"
              class="col-span-3"
              required
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="description" class="text-right">Descrição</Label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="Ex: Dispara quando um usuário faz a primeira compra."
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="conversion_value_field" class="text-right">Campo de Valor</Label>
            <Select v-model="form.conversion_value_field">
              <SelectTrigger class="w-full col-span-3">
                <SelectValue placeholder="Selecione um valor"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="value in values" :key="value" :value="value">
                  {{ value }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_primary" class="text-right">Tipo</Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch id="is_primary" v-model="form.is_primary" />
              <Label for="is_primary">{{ form.is_primary ? 'Primária' : 'Quantitativa' }}</Label>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="metric_source_type" class="text-right">Tipo de métrica/fonte</Label>
            <Input
              id="metric_source_type"
              v-model="form.metric_source_type"
              class="col-span-3"
              placeholder="Ex.: Evento de clique"
              required
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="conversion_category" class="text-right">Classificação de Conversão</Label>
            <Input
              id="conversion_category"
              v-model="form.conversion_category"
              class="col-span-3"
              placeholder="Ex.: strategic_return"
              required
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="channel_group" class="text-right">Grupo de Canais</Label>
            <Input
              id="channel_group"
              v-model="form.channel_group"
              class="col-span-3"
              required
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4" v-if="canManageReports">
            <Label for="is_return_report" class="text-right">
              Registrar no Retorno
            </Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch id="is_return_report" v-model="form.is_return_report" />
              <Label for="is_return_report">Incluir nos relatórios consolidados</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div class="p-4 space-y-4">
            <div class="flex flex-col space-y-1">
              <h3 class="font-medium leading-none tracking-tight flex items-center gap-2">
                Segmentos
                <span class="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground font-normal">
                  {{ form.conditions.length }}
                </span>
              </h3>
              <p class="text-sm text-muted-foreground">
                A conversão será usada se o usuário pertencer a estes segmentos.
              </p>
            </div>

            <div class="space-y-3">
              <div
                v-if="form.conditions.length === 0"
                class="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-md bg-muted/10 transition-colors hover:bg-muted/20"
              >
                <div class="bg-muted p-2 rounded-full mb-2">
                  <Search class="h-4 w-4 text-muted-foreground" />
                </div>
                <p class="text-sm font-medium text-foreground">Nenhum segmento adicionado</p>
                <p class="text-xs text-muted-foreground mb-3">Adicione regras para refinar sua conversão.</p>
                <Button variant="outline" size="sm" @click="addCondition('segment')">
                  Adicionar Primeiro Segmento
                </Button>
              </div>

              <transition-group name="list" tag="div" class="space-y-2">
                <div
                  v-for="(condition, index) in form.conditions"
                  :key="index"
                  class="group flex items-center gap-3 p-2 pr-3 border rounded-md bg-background transition-all hover:shadow-sm"
                >
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                    {{ index + 1 }}
                  </div>

                  <div class="flex-1 min-w-0">
                    <Select v-model="condition.conditionable_id">
                      <SelectTrigger class="w-full bg-transparent border-none shadow-none focus:ring-0 h-auto p-0 px-2">
                        <SelectValue placeholder="Selecione um Segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="segment in segments"
                          :key="segment.id"
                          :value="segment.id"
                        >
                          {{ segment.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    @click="removeCondition(index)"
                    class="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                    title="Remover segmento"
                  >
                    <Trash2Icon class="h-4 w-4"/>
                  </Button>
                </div>
              </transition-group>

              <Button
                v-if="form.conditions.length > 0"
                variant="outline"
                size="sm"
                @click="addCondition('segment')"
                class="w-full border-dashed text-muted-foreground hover:text-foreground"
              >
                <PlusIcon class="mr-2 h-4 w-4"/>
                Adicionar Outro Segmento
              </Button>
            </div>
          </div>
        </div>

      </div>

      <DialogFooter>
        <Button variant="outline" @click="() => modal = false">Cancelar</Button>
        <Button type="submit" @click="onSubmit" :disabled="isProcessing">
          <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2Icon, PlusIcon, Search, Trash2Icon } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import ConversionDefinitions from "@/services/conversionDefinitions";
import ErrorComponent from "@/components/layout/ErrorComponent.vue";

const props = defineProps<{ reload: (() => Promise<void>) }>();

const { toast } = useToast();
const errors = ref([]);
const modal = ref(false);
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const isProcessing = ref(false);
const values = ref<string[]>([]);
const segments = ref<any[]>([]);
const form = ref({
  id: null as number | null,
  name: "",
  description: "",
  is_primary: false,
  is_return_report: false,
  conversion_value_field: "",
  metric_source_type: "",
  conversion_category: "",
  channel_group: "",
  conditions: [] as any[],
});

const activeGroupProject = computed(() => workspaceStore.activeGroupProject || null);

const canManageReports = computed(() => {
  return authStore.user?.roles.some((role: any) =>
    role.permissions.some((permission: any) => permission.name === 'access-to-member-governance')
  );
});

const resetForm = () => {
  form.value = {
    id: null,
    name: "",
    description: "",
    is_primary: false,
    is_return_report: false,
    conversion_value_field: "",
    metric_source_type: "",
    conversion_category: "",
    channel_group: "",
    conditions: [],
  };
};

const fetchValues = async () => {
  try {
    values.value = await ConversionDefinitions.values();
  } catch (error) {
    console.error("Error loading values:", error);
  }
}

const fetchSegments = async () => {
  try {
    segments.value = await ConversionDefinitions.segments({
      filter_id: activeGroupProject.value?.id
    })
  } catch (e) {
    console.error(e)
  }
}

const fetchChannelGroups = async () => {
  try {
    values.value = await ConversionDefinitions.channelGroups({
      project_id: String(activeGroupProject.value?.id).split('_')[1],
    });
  } catch (error) {
    console.error("Error loading values:", error);
  }
}

const addCondition = (type: string) => {
  if (type === "segment") {
    form.value.conditions.push({
      conditionable_type: "segment",
      conditionable_id: null,
    });
  }
};

const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1);
};

const onSubmit = async () => {
  isProcessing.value = true;

  try {
    const payload = {
      name: form.value.name,
      description: form.value.description,
      type: "segment_membership",
      is_primary: form.value.is_primary,
      is_return_report: form.value.is_return_report,
      project_id: activeGroupProject.value?.id,
      conversion_value_field: form.value.conversion_value_field,
      metric_source_type: form.value.metric_source_type,
      conversion_category: form.value.conversion_category,
      channel_group: form.value.channel_group,
      conditions: form.value.conditions.filter(c => c.conditionable_id),
    };

    await ConversionDefinitions.store(payload);
    await props.reload()

    modal.value = false

    toast({
      title: "Sucesso",
      description: "Definição de conversão criada com sucesso",
      variant: "default",
    });
  } catch (error: any) {
    errors.value = error.response.data.errors
  }

  isProcessing.value = false;
};

const openModal = async () => {
  resetForm()

  await fetchValues()
  await fetchSegments()
  await fetchChannelGroups()

  modal.value = true
}
</script>
