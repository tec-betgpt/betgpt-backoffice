<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <slot>
        <Button size="icon" variant="ghost">
          <Pencil class="h-4 w-4"/>
        </Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-2xl max-h-[60vw] overflow-y-scroll">
      <DialogHeader>
        <DialogTitle>
          Editar Definição de Conversão
        </DialogTitle>
        <DialogDescription>
          Edite as regras para sua definição de conversão.
        </DialogDescription>
      </DialogHeader>

<!--      <ErrorComponent :errors="errors" />-->

      <div class="grid gap-6 p-4">
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
            <Label for="is_primary" class="text-right">Tipo</Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch id="is_primary" v-model="form.is_primary"/>
              <Label for="is_primary">{{ form.is_primary ? 'Primária' : 'Quantitativa' }}</Label>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label> Registrar no retorno</Label>
            <div class="col-span-3 flex items-center space-x-2">
              <Switch id="return_report" :disabled="form.is_primary"  v-model="form.is_return_report"/>
              <Label for="return_report">Incluir nos relatórios consolidados</Label>
            </div>
          </div>
        </div>

        <div v-if="!form.id" class="space-y-4">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-40 w-full" />
        </div>

        <div v-else-if="form.conversion_category === 'Elevate'" class="space-y-6">
          <div class="space-y-4 pt-4">

            <div class="grid grid-cols-4 items-center gap-4">
              <Label> Campo de Dados</Label>
              <div class="col-span-3 flex items-center space-x-2">
                <Select v-model="form.conversion_value_field">
                  <SelectTrigger class="w-full">
                    <SelectValue placeholder="Selecione um campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                        v-for="value in values"
                        :key="value"
                        :value="value"
                    >
                      {{ value }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div class="p-4 space-y-4">
              <div class="flex flex-col space-y-1">
                <h3 class="font-medium leading-none tracking-tight flex items-center gap-2">
                  Segmento de condição
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

        <div v-else-if="form.conversion_category === 'Google Analytics'" class="space-y-6">
          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div class="p-4 space-y-4">
              <div class="flex flex-col space-y-1">
                <h3 class="font-medium leading-none tracking-tight flex items-center gap-2">
                  Canais de Grupo
                  <span class="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground font-normal">
                    {{ form.conditions.length }}
                  </span>
                </h3>
                <p class="text-sm text-muted-foreground">
                  A conversão será disparada se o usuário acessar por um destes canais.
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
                  <p class="text-sm font-medium text-foreground">Nenhum canal de grupo adicionado</p>
                  <p class="text-xs text-muted-foreground mb-3">Adicione regras para refinar sua conversão.</p>
                  <Button variant="outline" size="sm" @click="addCondition('channel_group_analytics')">
                    Adicionar Primeiro Canal de Grupo
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
                      <Select v-model="condition.conditionable_id" @update:modelValue="condition.conditionable_rule = ''">
                        <SelectTrigger class="w-full bg-transparent border-none shadow-none focus:ring-0 h-auto p-0 px-2">
                          <SelectValue placeholder="Selecione um Canal de Grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                              v-for="channel in channels"
                              :key="channel.name"
                              :value="channel.name"
                          >
                            {{ channelTranslations[channel.displayName] || channel.nickName }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div v-if="condition.conditionable_id" class="flex-1 min-w-0">
                      <Select v-model="condition.conditionable_rule">
                        <SelectTrigger class="w-full bg-transparent border-none shadow-none focus:ring-0 h-auto p-0 px-2">
                          <SelectValue placeholder="Selecione uma Regra" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                              v-for="(rule,index) in (channels.find(c => c.name === condition.conditionable_id) || {rules: []}).rules"
                              :key="index"
                              :value="rule.display_name"
                          >
                            {{ rule.display_name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        @click="removeCondition(index)"
                        class="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                        title="Remover canal de grupo"
                    >
                      <Trash2Icon class="h-4 w-4"/>
                    </Button>
                  </div>
                </transition-group>

                <Button
                    v-if="form.conditions.length > 0"
                    variant="outline"
                    size="sm"
                    @click="addCondition('channel_group_analytics')"
                    class="w-full border-dashed text-muted-foreground hover:text-foreground"
                >
                  <PlusIcon class="mr-2 h-4 w-4"/>
                  Adicionar Outro Canal de Grupo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" @click="onSubmit" :disabled="isProcessing">
          <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2Icon, PlusIcon, Search, Trash2Icon, Pencil } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import ConversionDefinitions from "@/services/conversionDefinitions";
import ErrorComponent from "@/components/layout/ErrorComponent.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const props = defineProps<{ row: object, reload: (() => Promise<void>) }>();

const { toast } = useToast();
const open = ref(false);
const errors = ref([]);
const workspaceStore = useWorkspaceStore();
const isProcessing = ref(false);
const values = ref<string[]>([]);
const segments = ref<any[]>([]);
const channels = ref<any[]>([]);

const form = ref({
  id: null,
  name: "",
  description: "",
  is_primary: false,
  is_return_report: false,
  conversion_value_field: "",
  conversion_category: "",
  conditions: [] as any[],
});

const activeGroupProject = computed(() => workspaceStore.activeGroupProject || null);

const resetForm = () => {
  form.value = {
    id: null,
    name: "",
    description: "",
    is_primary: false,
    is_return_report: false,
    conversion_value_field: "",
    conversion_category: "",
    conditions: [],
  };
};
const channelTranslations = {
  'sessionDefaultChannelGroup': 'Grupo de canais padrão da sessão',
  'sessionPrimaryChannelGroup': 'Grupo principal de canais da sessão',
  'sessionSourceMedium': 'Origem / mídia da sessão',
  'sessionMedium': 'Sessão / Mídia',
  'sessionSource': 'Origem da sessão',
  'sessionTrafficOrigin': 'Plataforma de origem da sessão',
  'sessionCampaignName': 'Campanha da sessão',
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
    if (!activeGroupProject.value?.project_id) return;
    let response = await ConversionDefinitions.channelGroups({
      project_id: activeGroupProject.value?.project_id
    });
    channels.value = response.data
  } catch (error) {
    console.error("Error loading channel groups:", error);
  }
}

const addCondition = (type: string) => {
  if (type === "segment") {
    form.value.conditions.push({
      conditionable_type: "segment",
      conditionable_id: null,
    });
  }
  if (type === "channel_group_analytics") {
    form.value.conditions.push({
      conditionable_type: "channel_group_analytics",
      conditionable_id: null,
      conditionable_rule: null
    })
  }
};

const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1);
};

const show = async () => {
  try {
    const response = await ConversionDefinitions.show(props.row.id);
    form.value = {
      ...form.value,
      ...response
    }
  } catch (e) {
    console.error(e)
  }
}

const onSubmit = async () => {
  isProcessing.value = true;
  errors.value = [];

  try {
    const payload:any = {
      name: form.value.name,
      description: form.value.description,
      project_id: activeGroupProject.value?.project_id,
    };

    const category = form.value.conversion_category?.toLowerCase();

    if (category === 'elevate') {
      payload.is_primary = form.value.is_primary;
      payload.conditions = form.value.conditions.filter(c => c.conditionable_id);
      payload.is_return_report = form.value.is_return_report;
      payload.conversion_category = "Elevate";
      payload.conversion_value_field = form.value.conversion_value_field;
    } else if (category === 'google analytics') {
      payload.conditions = form.value.conditions
          .filter(c => c.conditionable_id && c.conditionable_rule)
          .map(condition => {
            const channel = channels.value.find(c => c.name === condition.conditionable_id);
            return {
              conditionable_type: 'channel_group_analytics',
              conditionable_id: condition.conditionable_id,
              conditionable_rule: condition.conditionable_rule,
              conditionable_name: channel ? channel.displayName : '',
            }
          });
      payload.conversion_category = "Google Analytics";
      payload.is_primary = form.value.is_primary;
      payload.is_return_report = form.value.is_return_report;

    }

    await ConversionDefinitions.update(props.row.id, payload);
    await props.reload()

    open.value = false;

    toast({
      title: "Sucesso",
      description: "Definição de conversão atualizada com sucesso",
      variant: "default",
    });
  } catch (error: any) {
    if (error.response && error.response.data) {
      errors.value = error.response.data.errors;
    }
    console.error(error);
  }

  isProcessing.value = false;
};

watch(open, async (isOpen) => {
  if (isOpen) {
    resetForm();
    await Promise.all([
      fetchValues(),
      fetchSegments(),
      fetchChannelGroups()
    ]);
    await show();
  }
})
</script>

