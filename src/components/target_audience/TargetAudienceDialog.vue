<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle>{{ isEditing ? 'Editar' : 'Criar' }} Público Alvo</DialogTitle>
        <DialogDescription>
          Defina as regras e detalhes do seu público alvo.
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto p-6 space-y-4">
        <div class="space-y-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="ta-name" class="text-right">Nome</Label>
            <Input id="ta-name" v-model="form.name" placeholder="Ex: Compradores de alto valor" class="col-span-3" />
          </div>
          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="ta-description" class="text-right mt-2">Descrição</Label>
            <Textarea id="ta-description" v-model="form.description" placeholder="Descrição opcional" class="col-span-3" rows="2" />
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
            <Input id="ta-duration" v-model="form.duration" placeholder="Permanente" class="col-span-3" />
          </div>

          <div class="grid grid-cols-4 items-start gap-4">
            <Label class="text-right mt-2">Sincronizar com</Label>
            <div class="col-span-3 space-y-2">
                <div v-for="provider in availableProviders" :key="provider.id" class="flex items-center gap-2">
                    <Checkbox
                        :id="'provider-' + provider.id"
                        :checked="form.sync_providers.includes(provider.id)"
                        @update:checked="(checked) => updateSyncProviders(checked, provider.id)"
                    />
                    <Label :for="'provider-' + provider.id" class="font-normal">{{ provider.label }}</Label>
                </div>
            </div>
          </div>

          <Separator class="my-4" />

          <div class="space-y-4">
            <template v-for="(group, groupIndex) in form.condition_groups" :key="groupIndex">
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
                        <button
                            v-if="form.condition_groups.length > 1"
                            class="text-destructive hover:bg-destructive/10 p-1 rounded"
                            @click="removeConditionGroup(groupIndex)"
                        >
                            <Trash2Icon class="h-4 w-4" />
                        </button>
                    </div>

                    <div class="space-y-3">
                        <template v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex">
                           <div v-if="conditionIndex > 0" class="flex justify-center items-center text-sm font-bold text-muted-foreground pt-2">
                                {{ group.logic_operator === 'AND' ? 'E' : 'OU' }}
                            </div>

                            <div class="flex items-center gap-2 py-1">
                                <Popover v-model:open="condition.open">
                                  <PopoverTrigger as-child>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      :aria-expanded="condition.open"
                                      class="flex-1 min-w-[200px] justify-between text-left font-normal"
                                    >
                                      {{ condition.field 
                                          ? $t(fields.flatMap(g => g.fields).find(f => `${f.source}:${f.field_key}` === condition.field)?.label || 'Selecione um campo')
                                          : 'Selecione um campo' 
                                      }}
                                      <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent class="w-[300px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Buscar campo..." />
                                      <CommandEmpty>Nenhum campo encontrado.</CommandEmpty>
                                      <CommandList>
                                        <CommandGroup v-for="fieldGroup in fields" :key="fieldGroup.name" :heading="$t(fieldGroup.name)">
                                          <CommandItem
                                            v-for="field in fieldGroup.fields"
                                            :key="`${field.source}:${field.field_key}`"
                                            :value="`${field.source}:${field.field_key}`"
                                            @select="() => {
                                              condition.field = `${field.source}:${field.field_key}`;
                                              condition.open = false;
                                              // Reset operator and value when field changes
                                              condition.operator = '';
                                              condition.value = '';
                                            }"
                                          >
                                            <CheckIcon
                                              :class="[
                                                'mr-2 h-4 w-4',
                                                condition.field === `${field.source}:${field.field_key}` ? 'opacity-100' : 'opacity-0',
                                              ]"
                                            />
                                            {{ $t(field.label) }}
                                          </CommandItem>
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>

                                <Select v-model="condition.operator" class="flex-1 min-w-[120px]">
                                <SelectTrigger>
                                    <SelectValue placeholder="Operador" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                    <SelectLabel>Operadores</SelectLabel>
                                    <SelectItem v-for="op in getOperators(condition)" :key="op" :value="op">
                                        {{ $t(op) }}
                                    </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                                </Select>

                                <template v-if="['date', 'datetime', 'date_md'].includes(getField(condition)?.data_type) && !['empty', 'not_empty'].includes(condition.operator)">
                                    <Select v-model="condition.dateValueType" class="w-40">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo de Data" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="relative">Data Atual</SelectItem>
                                            <SelectItem value="fixed">Selecionar Data</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div v-if="condition.dateValueType === 'relative'" class="flex gap-2 flex-1 min-w-[240px]">
                                        <Select v-model="condition.dateModifier" class="flex-1">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Modificador" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="exact">Exatamente</SelectItem>
                                                <SelectItem value="plus">Mais</SelectItem>
                                                <SelectItem value="minus">Menos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input 
                                            v-if="condition.dateModifier !== 'exact'"
                                            v-model.number="condition.daysOffset"
                                            type="number"
                                            placeholder="Dias"
                                            class="w-24"
                                        />
                                    </div>

                                    <template v-else>
                                        <Input
                                            v-if="showDateInput(condition)"
                                            v-model="condition.value"
                                            :type="getField(condition)?.data_type === 'datetime' ? 'datetime-local' : 'date'"
                                            class="flex-1 min-w-[240px]"
                                        />
                                        <div v-else-if="showDayMonthInput(condition)" class="flex gap-2 flex-1 min-w-[240px]">
                                            <Select :model-value="getMonthValue(condition.value)" @update:model-value="v => updateDayMonthValue(condition, 'month', v)">
                                                <SelectTrigger class="flex-1">
                                                    <SelectValue placeholder="Mês" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select :model-value="getDayValue(condition.value)" @update:model-value="v => updateDayMonthValue(condition, 'day', v)">
                                                <SelectTrigger class="flex-1">
                                                    <SelectValue placeholder="Dia" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem v-for="d in days" :key="d.value" :value="d.value">{{ d.label }}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </template>
                                </template>

                                <template v-else-if="!['empty', 'not_empty'].includes(condition.operator)">
                                    <Select
                                        v-if="getField(condition)?.options"
                                        v-model="condition.value"
                                        class="flex-1 min-w-[240px]"
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem v-for="option in getField(condition).options" :key="option.value || option.id" :value="String(option.value || option.id)">
                                                {{ option.label || option.name }}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Input
                                        v-else-if="showTextInput(condition)"
                                        v-model="condition.value"
                                        placeholder="Valor"
                                        class="flex-1 min-w-[240px]"
                                    />

                                    <Input
                                        v-else-if="showNumberInput(condition)"
                                        v-model.number="condition.value"
                                        placeholder="Número"
                                        type="number"
                                        class="flex-1 min-w-[240px]"
                                    />

                                    <Select
                                        v-else-if="showBooleanInput(condition)"
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
                                </template>

                                <button
                                    v-if="group.conditions.length > 1"
                                    class="text-destructive hover:bg-destructive/10 p-1 rounded"
                                    @click="removeCondition(groupIndex, conditionIndex)"
                                >
                                    <Trash2Icon class="h-4 w-4" />
                                </button>
                            </div>
                        </template>

                        <Button variant="outline" size="sm" @click="addCondition(groupIndex)" class="mt-2">
                          <PlusIcon class="mr-2 h-4 w-4" />
                          Adicionar Condição
                        </Button>
                    </div>
                </div>
            </template>

            <Button variant="outline" @click="addConditionGroup">
              <PlusIcon class="mr-2 h-4 w-4" />
              Adicionar Grupo de Condições
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter class="p-6 pt-0 flex justify-end gap-2">
         <Button variant="outline" @click="isOpen = false">Cancelar</Button>
         <Button @click="save" :disabled="isProcessing">
            <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
         </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import TargetAudience from "@/services/targetAudience";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  Trash2Icon,
  Loader2Icon,
  InfoIcon,
  CheckIcon,
  ChevronsUpDownIcon,
} from "lucide-vue-next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkspaceStore } from "@/stores/workspace";

const emit = defineEmits(['saved']);

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const isEditing = ref(false);
const isProcessing = ref(false);
const fields = ref([]);
const responseFieldsFlat = ref([]);
const segmentId = ref()
const form = ref({
  id: null,
  name: "",
  description: "",
  duration: null,
  condition_groups: [],
  sync_providers: [],
});

const availableProviders = [
  { id: 'meta', label: 'Meta Ads' },
];

const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
const months = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
];

const resetForm = () => {
  form.value = {
    id: null,
    name: "",
    description: "",
    duration: null,
    condition_groups: [
      {
        logic_operator: "AND",
        conditions: [{ field: "", operator: "", value: "", open: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
      },
    ],
    sync_providers: [],
  };
};

const fetchFields = async () => {
  try {
    const response = await TargetAudience.getAvailableConditions();
    if (Array.isArray(response)) {
      responseFieldsFlat.value = response;
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
          options: field.options,
        });
        return acc;
      }, {});
      fields.value = Object.values(groups);
    }
  } catch (error) {
    console.error("Error loading audience fields:", error);
  }
};
const openWithSegment = async (segment) => {
  resetForm();
  await fetchFields();
  segmentId.value = segment;
  isOpen.value = true;
};
const open = async (audienceId = null) => {
  resetForm();
  await fetchFields();
  
  if (audienceId) {
    isEditing.value = true;
    try {
      isProcessing.value = true;
      const data = await TargetAudience.show({ id: audienceId });
      parseDataToForm(data);
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar os dados.', variant: 'destructive' });
      return;
    } finally {
      isProcessing.value = false;
    }
  } else {
    isEditing.value = false;
  }
  
  isOpen.value = true;
};

const parseDataToForm = (data) => {
    form.value.id = data.id;
    form.value.name = data.name;
    form.value.description = data.description;
    form.value.duration = data.duration;
    form.value.sync_providers = data.syncs ? data.syncs.map(sync => sync.provider) : [];

    if (data.condition_groups && data.condition_groups.length > 0) {
        form.value.condition_groups = data.condition_groups.map(group => ({
            logic_operator: group.logic_operator || 'AND',
            conditions: group.conditions.map(c => {
                let dateValueType = "fixed";
                let dateModifier = "exact";
                let daysOffset = 0;
                let value = c.value;

                const field = responseFieldsFlat.value.find(f => f.source === c.source && f.property === c.property);
                const isDateField = field && ['date', 'datetime', 'date_md'].includes(field.type);

                if (isDateField) {
                    if (c.value === 'today' || !isNaN(Number(c.value))) {
                        dateValueType = "relative";
                        if (c.value === 'today' || Number(c.value) === 0) {
                            dateModifier = "exact";
                        } else {
                            const numValue = Number(c.value);
                            if (numValue > 0) {
                                dateModifier = "plus";
                                daysOffset = numValue;
                            } else {
                                dateModifier = "minus";
                                daysOffset = Math.abs(numValue);
                            }
                        }
                    }
                }

                return {
                    field: `${c.source}:${c.property}`,
                    operator: c.operator,
                    value: value,
                    open: false,
                    dateValueType,
                    dateModifier,
                    daysOffset
                };
            })
        }));
    }
};

const updateSyncProviders = (checked, providerId) => {
  const providers = form.value.sync_providers;
  const index = providers.indexOf(providerId);
  if (checked && index === -1) providers.push(providerId);
  else if (!checked && index !== -1) providers.splice(index, 1);
};

const getField = (condition) => {
  if (!condition?.field) return null;
  const [source, fieldKey] = condition.field.split(':');
  const group = fields.value.find(g => g.name === source);
  return group ? group.fields.find((f) => f.field_key === fieldKey) : null;
};

const getOperators = (condition) => {
  const field = getField(condition);
  return field ? field.operators || [] : [];
};

const showTextInput = (condition) => getField(condition)?.data_type === 'string';
const showNumberInput = (condition) => ['number', 'integer', 'float', 'numeric'].includes(getField(condition)?.data_type);
const showBooleanInput = (condition) => getField(condition)?.data_type === 'boolean';
const showDateInput = (condition) => ['date', 'datetime'].includes(getField(condition)?.data_type);
const showDayMonthInput = (condition) => getField(condition)?.data_type === 'date_md';

const getDayValue = (value) => value?.split('-')[1] || '';
const getMonthValue = (value) => value?.split('-')[0] || '';
const updateDayMonthValue = (condition, type, val) => {
  let [m, d] = (condition.value || '-').split('-');
  if (type === 'month') m = val;
  if (type === 'day') d = val;
  condition.value = `${m || '01'}-${d || '01'}`;
};

const addConditionGroup = () => {
  form.value.condition_groups.push({
    logic_operator: "AND",
    conditions: [{ field: "", operator: "", value: "", open: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
  });
};

const removeConditionGroup = (index) => {
  if (form.value.condition_groups.length > 1) form.value.condition_groups.splice(index, 1);
};

const addCondition = (groupIndex) => {
  form.value.condition_groups[groupIndex].conditions.push({
    field: "", operator: "", value: "", open: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0
  });
};

const removeCondition = (groupIndex, conditionIndex) => {
  if (form.value.condition_groups[groupIndex].conditions.length > 1) {
    form.value.condition_groups[groupIndex].conditions.splice(conditionIndex, 1);
  }
};

const save = async () => {
    isProcessing.value = true;
    try {
        const activeGroupProjectId = workspaceStore.activeGroupProject?.id;
        if (!activeGroupProjectId) throw new Error("Nenhum projeto selecionado.");

        const payload = {
            project_id: workspaceStore.activeGroupProject.project_id,
            name: form.value.name,
            description: form.value.description,
            duration: form.value.duration,
            sync_providers: form.value.sync_providers,
            segment_id: segmentId.value,
            condition_groups: form.value.condition_groups.map(group => ({
                logic_operator: group.logic_operator,
                conditions: group.conditions.map(c => {
                    const field = getField(c);
                    if (!field || !c.operator) return null;
                    
                    let finalValue = c.value;
                    const isDateField = ['date', 'datetime', 'date_md'].includes(field.data_type);

                    if (isDateField && c.dateValueType === 'relative') {
                        if (c.dateModifier === 'exact') finalValue = 'today';
                        else {
                            const offset = c.daysOffset || 0;
                            finalValue = c.dateModifier === 'minus' ? -offset : offset;
                        }
                    } else if (c.value === '' && !['empty', 'not_empty'].includes(c.operator)) {
                        return null;
                    }

                    return {
                        source: field.source,
                        property: field.field_key,
                        operator: c.operator,
                        value: finalValue,
                    };
                }).filter(Boolean)
            })).filter(g => g.conditions.length > 0)
        };

        if (!payload.name) throw new Error('O nome do público alvo é obrigatório.');
        if (payload.condition_groups.length === 0) throw new Error("Defina pelo menos uma condição válida.");

        if (isEditing.value) {
            await TargetAudience.update(form.value.id, payload);
        } else {
            await TargetAudience.store(payload);
        }

        toast({ title: "Sucesso!", description: `Público alvo ${isEditing.value ? 'atualizado' : 'salvo'} com sucesso.` });
        isOpen.value = false;
        emit('saved');
    } catch(e) {
        toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
        isProcessing.value = false;
    }
};

defineExpose({ open,openWithSegment });
</script>