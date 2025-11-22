<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="w-full flex justify-between items-center max-sm:flex-col">
      <div class="space-y-0.">
        <h2 class="text-2xl font-bold tracking-tight">Gerenciar Públicos Alvo</h2>
        <p class="text-muted-foreground">
          Crie e gerencie seus públicos alvo.
        </p>
      </div>

      <div class="w-full flex max-sm:justify-center justify-end max-sm:flex-col gap-2 max-sm:mt-3 items-center">
        <Button @click="openCreateSheet" class="max-sm:w-full">
          <PlusIcon class="mr-2 h-4 w-4" />
          Novo Público Alvo
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Públicos Alvo</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="audiences"
          :columns="columns"
          :find="fetchAudiences"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
        <CustomPagination
          class="mt-4"
          :select-page="fetchAudiences"
          :pages="pages"
          :per_pages="perPage"
          @update:perPages="args => perPage = args"
        />
      </CardContent>
    </Card>

    <div
      v-if="showSheet"
      class="fixed inset-0 z-40 bg-black/80"
      @click="showSheet = false"
    ></div>
    <div
      :class="[
        'fixed top-0 right-0 z-50 h-full w-3/5 transform bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out',
        showSheet ? 'translate-x-0' : 'translate-x-full',
      ]"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">{{ isEditing ? 'Editar' : 'Criar' }} Público Alvo</h2>
        <Button variant="ghost" @click="showSheet = false">
          <XIcon class="h-4 w-4" />
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        Defina as regras e detalhes do seu público alvo.
      </p>

      <div class="mt-4 h-[calc(100%-8rem)] overflow-y-auto pr-4">
        <div class="space-y-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="ta-name" class="text-right">Nome</Label>
            <Input id="ta-name" v-model="targetAudienceForm.name" placeholder="Ex: Compradores de alto valor" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="ta-description" class="text-right mt-2">Descrição</Label>
            <Textarea id="ta-description" v-model="targetAudienceForm.description" placeholder="Descrição opcional" class="col-span-3" rows="2" />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <div class="text-right flex items-center justify-end gap-1">
                <Label for="ta-duration">Duração da Adesão</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon class="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Número de dias que um contato permanecerá no público.<br>Deixe em branco para adesão permanente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
            <Input id="ta-duration" v-model.number="targetAudienceForm.duration" placeholder="Permanente" class="col-span-3" />
          </div>

          <div class="grid grid-cols-4 items-start gap-4">
            <Label class="text-right mt-2">Sincronizar com</Label>
            <div class="col-span-3 space-y-2">
                <div v-for="provider in availableProviders" :key="provider.id" class="flex items-center gap-2">
                    <Checkbox
                        :id="'provider-' + provider.id"
                        :checked="targetAudienceForm.sync_providers.includes(provider.id)"
                        @update:checked="(checked) => updateSyncProviders(checked, provider.id)"
                    />
                    <Label :for="'provider-' + provider.id" class="font-normal">{{ provider.label }}</Label>
                </div>
            </div>
          </div>

          <Separator class="my-4" />

          <div class="space-y-4">
            <template v-for="(group, groupIndex) in targetAudienceForm.condition_groups" :key="groupIndex">
                <div v-if="groupIndex > 0" class="relative flex justify-center">
                    <div class="absolute inset-0 flex items-center">
                        <span class="w-full border-t"></span>
                    </div>
                    <div class="relative flex justify-center text-xs uppercase">
                        <span class="bg-background px-2 text-muted-foreground font-semibold">E</span>
                    </div>
                </div>

                <div class="space-y-4 p-4 border rounded-md">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
                             <div class="flex items-center gap-2">
                                <Label class="text-sm text-muted-foreground">Lógica interna:</Label>
                                <ToggleGroup
                                    v-model="group.logic_operator"
                                    type="single"
                                    variant="outline"
                                    class="h-8"
                                >
                                    <ToggleGroupItem value="AND" class="h-8 px-3">E</ToggleGroupItem>
                                    <ToggleGroupItem value="OR" class="h-8 px-3">OU</ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                        <Button
                            v-if="targetAudienceForm.condition_groups.length > 1"
                            variant="ghost"
                            size="sm"
                            @click="removeTaConditionGroup(groupIndex)"
                            class="text-destructive"
                        >
                            <Trash2Icon class="h-4 w-4" />
                        </Button>
                    </div>

                    <div class="space-y-3">
                        <template v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex">
                           <div v-if="conditionIndex > 0" class="flex justify-center items-center text-sm font-bold text-muted-foreground pt-2">
                                {{ group.logic_operator === 'AND' ? 'E' : 'OU' }}
                            </div>

                            <div class="flex items-center gap-2 py-1">
                                <Select v-model="condition.field" class="flex-1 min-w-[120px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup v-for="fieldGroup in targetAudienceFields" :key="fieldGroup.name">
                                    <SelectLabel>{{ $t(fieldGroup.name) }}</SelectLabel>
                                    <SelectItem v-for="field in fieldGroup.fields" :key="field.field_key" :value="field.field_key">
                                        {{ $t(field.label) }}
                                    </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>

                                <Select v-model="condition.operator" class="flex-1 min-w-[120px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Operador" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    <SelectLabel>Operadores</SelectLabel>
                                    <SelectItem v-for="op in getTaOperators(condition)" :key="op" :value="op">
                                        {{ $t(op) }}
                                    </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>

                                <Input
                                v-if="showTaTextInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"
                                v-model="condition.value"
                                placeholder="Valor"
                                class="flex-1 min-w-[240px]"
                                />

                                <Input
                                v-else-if="showTaNumberInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"
                                v-model.number="condition.value"
                                placeholder="Número"
                                type="number"
                                class="flex-1"
                                />

                                <Select
                                v-else-if="showTaBooleanInput(condition)"
                                v-model="condition.value"
                                class="flex-1"
                                >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Sim</SelectItem>
                                    <SelectItem value="false">Não</SelectItem>
                                </SelectContent>
                                </Select>

                                <Button v-if="group.conditions.length > 1" variant="ghost" size="sm" @click="removeTaCondition(groupIndex, conditionIndex)" class="text-destructive">
                                <Trash2Icon class="h-4 w-4" />
                                </Button>
                            </div>
                        </template>

                        <Button variant="outline" size="sm" @click="addTaCondition(groupIndex)" class="mt-2">
                        <PlusIcon class="mr-2 h-4 w-4" />
                        Adicionar Condição
                        </Button>
                    </div>
                </div>
            </template>

            <Button variant="outline" @click="addTaConditionGroup">
              <PlusIcon class="mr-2 h-4 w-4" />
              Adicionar Grupo de Condições
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-auto pt-6 flex justify-end gap-2">
         <Button variant="outline" @click="showSheet = false">Cancelar</Button>
         <Button @click="saveTargetAudience" :disabled="isProcessing">
            <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
         </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, watch } from "vue";
import { useRoute } from 'vue-router';
import TargetAudience from "@/services/targetAudience";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  XIcon,
  Trash2Icon,
  Loader2Icon,
  InfoIcon,
  MoreHorizontalIcon,
} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import CustomPagination from "@/components/custom/CustomPagination.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { createColumnHelper } from "@tanstack/vue-table";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const { toast } = useToast();
const isLoading = ref(false);
const isProcessing = ref(false);
const showSheet = ref(false);
const isEditing = ref(false);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const audiences = ref<Array<any>>([]);
const targetAudienceFields = ref([]);
const perPage = ref(10);

const availableProviders = [
  { id: 'meta', label: 'Meta Ads' },
  { id: 'google-analytics', label: 'Google Analytics' }
];

const targetAudienceForm = ref({
  id: null,
  name: "",
  description: "",
  duration: null,
  condition_groups: [],
  sync_providers: [],
});

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

const fetchAudiences = async (current = pages.value.current) => {
  if (!activeGroupProjectId) return;
  isLoading.value = true;
  try {
    const params = {
      page: current,
      per_page: perPage.value,
      project_id: activeGroupProjectId,
    };
    const response = await TargetAudience.index(params);
    audiences.value = response.data || [];
    pages.value = {
      current: response.current_page,
      last: response.last_page,
      total: response.total,
    };
  } catch (error) {
    console.error("Error loading target audiences:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os públicos alvo.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};
watch(perPage, ()=> fetchAudiences(1));


const openCreateSheet = () => {
  resetTargetAudienceForm();
  isEditing.value = false;
  showSheet.value = true;
};

const openEditSheet = async (audience) => {
  try {
    isProcessing.value = true;
    const fullAudienceData = await TargetAudience.show({id:audience.id});
    parseAudienceDataToForm(fullAudienceData);
    isEditing.value = true;
    showSheet.value = true;
  } catch (error) {
    toast({ title: 'Erro', description: 'Não foi possível carregar os dados do público alvo.', variant: 'destructive' });
  } finally {
    isProcessing.value = false;
  }
};

const resetTargetAudienceForm = () => {
  targetAudienceForm.value = {
    id: null,
    name: "",
    description: "",
    duration: null,
    condition_groups: [
      {
        logic_operator: "AND",
        conditions: [{ field: "", operator: "", value: "" }],
      },
    ],
    sync_providers: [],
  };
};

const parseAudienceDataToForm = (audienceData) => {
    targetAudienceForm.value.id = audienceData.id;
    targetAudienceForm.value.name = audienceData.name;
    targetAudienceForm.value.description = audienceData.description;
    targetAudienceForm.value.duration = audienceData.duration;
    targetAudienceForm.value.sync_providers = audienceData.syncs ? audienceData.syncs.map(sync => sync.provider) : [];

    if (audienceData.condition_groups && audienceData.condition_groups.length > 0) {
        targetAudienceForm.value.condition_groups = audienceData.condition_groups.map(group => ({
            logic_operator: group.logic_operator || 'AND',
            conditions: group.conditions.map(c => ({
                field: c.property,
                operator: c.operator,
                value: c.value
            }))
        }));
    } else {
        targetAudienceForm.value.condition_groups = [
            {
                logic_operator: "AND",
                conditions: [{ field: "", operator: "", value: "" }],
            },
        ];
    }
};

const updateSyncProviders = (checked, providerId) => {
  const providers = targetAudienceForm.value.sync_providers;
  const index = providers.indexOf(providerId);

  if (checked && index === -1) {
    providers.push(providerId);
  } else if (!checked && index !== -1) {
    providers.splice(index, 1);
  }
};

// --- Condition Builder Logic ---

const getTaField = (condition) => {
  const allTaFields = targetAudienceFields.value.flatMap(g => g.fields);
  return condition?.field
    ? allTaFields.find((f) => f.field_key === condition.field)
    : null;
};

const getTaOperators = (condition) => {
  const field = getTaField(condition);
  return field ? field.operators || [] : [];
};

const showTaTextInput = (condition) => getTaField(condition)?.data_type === 'string';
const showTaNumberInput = (condition) => getTaField(condition)?.data_type === 'number';
const showTaBooleanInput = (condition) => getTaField(condition)?.data_type === 'boolean';

const addTaConditionGroup = () => {
  targetAudienceForm.value.condition_groups.push({
    logic_operator: "AND",
    conditions: [{ field: "", operator: "", value: "" }],
  });
};

const removeTaConditionGroup = (groupIndex) => {
  if (targetAudienceForm.value.condition_groups.length > 1) {
    targetAudienceForm.value.condition_groups.splice(groupIndex, 1);
  }
};

const addTaCondition = (groupIndex) => {
  targetAudienceForm.value.condition_groups[groupIndex].conditions.push({
    field: "",
    operator: "",
    value: "",
  });
};

const removeTaCondition = (groupIndex, conditionIndex) => {
  if (targetAudienceForm.value.condition_groups[groupIndex].conditions.length > 1) {
    targetAudienceForm.value.condition_groups[groupIndex].conditions.splice(conditionIndex, 1);
  }
};

const fetchTargetAudienceFields = async () => {
  try {
    const response = await TargetAudience.getAvailableConditions();
    if (Array.isArray(response)) {
      const groups = response.reduce((acc, field) => {
        if (!acc[field.source]) {
          acc[field.source] = { name: field.source, fields: [] };
        }
        acc[field.source].fields.push({
          field_key: field.property,
          label: field.label,
          data_type: field.type,
          operators: field.operators,
          source: field.source,
        });
        return acc;
      }, {});
      targetAudienceFields.value = Object.values(groups);
    } else {
       throw new Error("Unexpected data structure for audience fields");
    }
  } catch (error) {
    console.error("Error loading audience fields:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os campos para o público alvo.",
      variant: "destructive",
    });
  }
};

const saveTargetAudience = async () => {
    isProcessing.value = true;
    try {
        if (!activeGroupProjectId) throw new Error("Nenhum projeto selecionado.");

        const payload = {
            project_id: workspaceStore.activeGroupProject.project_id,
            name: targetAudienceForm.value.name,
            description: targetAudienceForm.value.description,
            duration: targetAudienceForm.value.duration,
            sync_providers: targetAudienceForm.value.sync_providers,
            condition_groups: targetAudienceForm.value.condition_groups.map(group => ({
                logic_operator: group.logic_operator,
                conditions: group.conditions.map(c => {
                    const field = getTaField(c);
                    if (!field || !c.operator || c.value === '') return null;
                    return {
                        source: field.source,
                        property: c.field,
                        operator: c.operator,
                        value: c.value,
                    };
                }).filter(Boolean)
            })).filter(g => g.conditions.length > 0)
        };

        if (!payload.name) throw new Error('O nome do público alvo é obrigatório.');
        if (payload.condition_groups.length === 0) throw new Error("Defina pelo menos uma condição válida.");

        if (isEditing.value) {
            await TargetAudience.update(targetAudienceForm.value.id, payload);
        } else {
            await TargetAudience.store(payload);
        }

        toast({ title: "Sucesso!", description: `Público alvo ${isEditing.value ? 'atualizado' : 'salvo'} com sucesso.` });
        showSheet.value = false;
        await fetchAudiences();
    } catch(e) {
        toast({ title: "Erro", description: e.message || `Não foi possível salvar o público alvo.`, variant: "destructive" });
    } finally {
        isProcessing.value = false;
    }
}

// --- Table Columns and Lifecycle ---

const columnHelper = createColumnHelper<any>();
const columns = [
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  columnHelper.accessor("description", {
    header: "Descrição",
    cell: ({ row }) => h("div", {}, row.getValue("description") || "-"),
  }),
    columnHelper.accessor("duration", {
    header: "Duração (dias)",
    cell: ({ row }) => h("div", {}, row.getValue("duration") ? `${row.getValue("duration")} dias` : 'Permanente'),
  }),
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => h(DropdownMenu, {}, [
      h(DropdownMenuTrigger, { asChild: true }, h(Button, { "aria-haspopup": "true", size: "icon", variant: "ghost" }, [h(MoreHorizontalIcon, { class: "h-4 w-4" }), h("span", { class: "sr-only" }, "Ações")])),
      h(DropdownMenuContent, { align: "end" }, [
        h(DropdownMenuLabel, {}, "Ações"),
        h(DropdownMenuItem, { onClick: () => openEditSheet(row.original) }, "Editar"),
      ]),
    ]),
  },
];

onMounted(async () => {
  isLoading.value = true;
  await fetchTargetAudienceFields();
  await fetchAudiences();
  
  const audienceIdToOpen = route.query.openAudienceId;
  if (audienceIdToOpen) {
    // Ensure we are not in a processing state from a previous action
    isProcessing.value = false; 
    await openEditSheet({ id: audienceIdToOpen });
  }
  
  isLoading.value = false;
});

</script>
