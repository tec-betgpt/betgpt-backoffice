<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-4xl max-h-[90dvh] overflow-y-scroll">
      <DialogHeader>
        <DialogTitle>
          {{ isEditing ? "Editar Segmento" : "Criar Novo Segmento" }}
        </DialogTitle>
        <DialogDescription>
          Defina as regras para seu segmento dinâmico
        </DialogDescription>
      </DialogHeader>

      <Card class="grid gap-4 p-4" v-for="(formItem, formIndex) in form" :key="formIndex">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">Nome do Segmento</Label>
          <Input
            id="name"
            v-model="formItem.name"
            placeholder="Ex: Clientes VIP"
            class="col-span-3"
            required
          />
        </div>

        <div class="grid grid-cols-4 items-start gap-4">
          <Label for="description" class="text-right mt-2">Descrição</Label>
          <Textarea
            id="description"
            v-model="formItem.description"
            placeholder="Descrição opcional do segmento"
            class="col-span-3"
            rows="2"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="dynamic" class="text-right mt-2">Dinâmico</Label>
          <Checkbox id="dynamic"  v-model="formItem.dynamic"
                    @update:checked="(checked) => {
                      formItem.dynamic = checked;
                    }"
                    :checked="formItem.dynamic" />
        </div>
        <Separator class="my-4" />

        <div class="space-y-6">
          <div
            v-for="(group, groupIndex) in formItem.condition_groups"
            :key="groupIndex"
            class="space-y-4"
          >
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
                  v-if="formItem.condition_groups.length > 1"
                  variant="ghost"
                  size="sm"
                  @click="removeConditionGroup(groupIndex, formIndex)"
                  class="text-destructive"
                >
                  <Trash2Icon class="h-4 w-4" />
                </Button>
              </div>

              <div class="space-y-3">
                <template
                  v-for="(condition, conditionIndex) in group.conditions"
                  :key="conditionIndex"
                >
                  <div
                    v-if="conditionIndex > 0"
                    class="flex justify-center items-center text-sm font-bold text-muted-foreground pt-2"
                  >
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
                          <Skeleton v-if="isLoadingFields" class="h-4 w-32" />
                          <template v-else>
                            {{ condition.field 
                                ? $t(fields.flatMap(g => g.fields).find(f => `${f.source}:${f.field_key}` === condition.field)?.label || 'Selecione um campo')
                                : 'Selecione um campo' 
                            }}
                          </template>
                          <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent class="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar campo..." />
                          <CommandEmpty v-if="!isLoadingFields">Nenhum campo encontrado.</CommandEmpty>
                          <div v-if="isLoadingFields" class="p-4 space-y-2">
                            <Skeleton class="h-8 w-full" />
                            <Skeleton class="h-8 w-full" />
                            <Skeleton class="h-8 w-full" />
                          </div>
                          <CommandList v-else>
                            <CommandGroup v-for="fieldGroup in fields" :key="fieldGroup.name" :heading="$t(fieldGroup.name)">
                              <CommandItem
                                v-for="field in fieldGroup.fields"
                                :key="`${field.source}:${field.field_key}`"
                                :value="`${field.source}:${field.field_key}`"
                                @select="() => {
                                  condition.field = `${field.source}:${field.field_key}`;
                                  condition.open = false;
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

                    <Select
                      v-model="condition.operator"
                      class="flex-1 min-w-[120px]"
                    >
                      <SelectTrigger>
                        <Skeleton v-if="isLoadingFields" class="h-4 w-20" />
                        <SelectValue v-else placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Operadores</SelectLabel>
                          <SelectItem
                            v-for="op in getOperators(condition, groupIndex, formIndex)"
                            :key="op"
                            :value="op"
                          >
                            {{ $t(op) }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <template v-if="!isLoadingFields">
                      <template v-if="!['empty', 'not_empty'].includes(condition.operator)">
                        <Select
                          v-if="getField(condition, groupIndex, formIndex)?.options"
                        v-model="condition.value"
                        class="flex-1 min-w-[240px]"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in getField(condition, groupIndex, formIndex).options" :key="option.value || option.id" :value="String(option.value || option.id)">
                            {{ option.label || option.name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        v-else-if="getField(condition, groupIndex, formIndex)?.field_key === 'protection_list_type'"
                        v-model="condition.value"
                        class="flex-1 min-w-[240px]"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="forced">Forçada</SelectItem>
                          <SelectItem value="exclusion">Exclusão</SelectItem>
                          <SelectItem value=" temp_suspension">Suspensão Temporária</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                          v-else-if="(getField(condition, groupIndex, formIndex)?.field_key === 'call4u_linked_status' || getField(condition, groupIndex, formIndex)?.table === 'call4u_linked_status') && !['empty', 'not_empty'].includes(condition.operator)"
                          v-model="condition.value"
                          class="flex-1 min-w-[240px]"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Atendida com digitação">Atendida com digitação</SelectItem>
                          <SelectItem value="Atendida e desconectada">Atendida e desconectada</SelectItem>
                          <SelectItem value="Atendida e ouviu até o final">Atendida e ouviu até o final</SelectItem>
                          <SelectItem value="Cancelado pelo Horário 23:00 às 07:30">Cancelado pelo Horário 23:00 às 07:30</SelectItem>
                          <SelectItem value="Em andamento">Em andamento</SelectItem>
                          <SelectItem value="Número está na Blacklist">Número está na Blacklist</SelectItem>
                          <SelectItem value="Número inválido">Número inválido</SelectItem>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Preparando para discagem">Preparando para discagem</SelectItem>
                          <SelectItem value="Recusada">Recusada</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        v-else-if="getField(condition, groupIndex, formIndex)?.field_key === 'protection_list'"
                        v-model="condition.value"
                        class="flex-1 min-w-[240px]"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LP_ENTERED">Entrada</SelectItem>
                          <SelectItem value="LP_EXiTED">Saída</SelectItem>
                          <SelectItem value="LP_UPDATED">Atualizar</SelectItem>
                        </SelectContent>
                      </Select>

                      <Popover v-else-if="getField(condition, groupIndex, formIndex)?.field_key === 'tag'" v-model:open="condition.tagOpen">
                        <PopoverTrigger as-child>
                          <Button
                            variant="outline"
                            role="combobox"
                            :aria-expanded="condition.tagOpen"
                            class="flex-1 min-w-[240px] justify-between text-left font-normal"
                          >
                            {{ availableTags.find(t => t.id == condition.value)?.name || 'Selecione uma Tag' }}
                            <ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-[300px] p-0" align="start">
                          <Command :filter-results="false">
                            <CommandInput placeholder="Buscar tag..." @input="onSearchTags" />
                            <CommandEmpty v-if="!isSearchingTags && availableTags.length === 0">Nenhuma tag encontrada.</CommandEmpty>
                            <div v-if="isSearchingTags" class="flex items-center justify-center p-4">
                              <Loader2Icon class="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                            <CommandList v-else>
                              <CommandGroup>
                                <CommandItem
                                  v-for="tag in availableTags"
                                  :key="tag.id"
                                  :value="tag.id"
                                  @select="() => {
                                    condition.value = tag.id;
                                    condition.tagOpen = false;
                                  }"
                                >
                                  <CheckIcon
                                    :class="[
                                      'mr-2 h-4 w-4',
                                      condition.value === tag.id ? 'opacity-100' : 'opacity-0',
                                    ]"
                                  />
                                  {{ tag.name }}
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <Input
                        v-else-if="showTextInput(condition, groupIndex, formIndex)"
                        v-model="condition.value"
                        placeholder="Valor"
                        class="flex-1 min-w-[240px]"
                      />

                      <Input
                        v-else-if="showNumberInput(condition, groupIndex, formIndex)"
                        v-model.number="condition.value"
                        placeholder="Número"
                        type="number"
                        class="flex-1 min-w-[120px]"
                      />

                      <template v-if="['date', 'datetime', 'date_md'].includes(getField(condition, groupIndex, formIndex)?.data_type)">
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
                            v-if="showDateInput(condition, groupIndex, formIndex)"
                            v-model="condition.value"
                            :type="getField(condition, groupIndex, formIndex)?.data_type === 'datetime' ? 'datetime-local' : 'date'"
                            class="flex-1 min-w-[240px]"
                          />
                          <div v-else-if="showDayMonthInput(condition, groupIndex, formIndex)" class="flex gap-2 flex-1 min-w-[240px]">
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

                      <Select
                        v-else-if="showBooleanInput(condition, groupIndex, formIndex)"
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
                    </template>

                    <div v-if="isLoadingFields" class="flex gap-2 flex-1 min-w-[240px]">
                      <Skeleton class="h-10 w-full" />
                      <Skeleton class="h-10 w-24" />
                      <Skeleton class="h-10 w-20" />
                    </div>

                    <Button
                      v-if="group.conditions.length > 1"
                      variant="ghost"
                      size="sm"
                      @click="removeCondition(groupIndex, conditionIndex, formIndex)"
                      class="text-destructive"
                    >
                      <Trash2Icon class="h-4 w-4" />
                    </Button>
                  </div>
                </template>

                <Button
                  variant="outline"
                  size="sm"
                  @click="addCondition(groupIndex, formIndex)"
                  class="mt-2"
                >
                  <PlusIcon class="mr-2 h-4 w-4" />
                  Adicionar Condição
                </Button>
              </div>

              <Button variant="outline" @click="addConditionGroup(formIndex)">
                <PlusIcon class="mr-2 h-4 w-4" />
                Adicionar Grupo de Condições
              </Button>
            </div>
          </div>

          <Separator class="my-4" />

        <div class="grid grid-cols-4 items-start gap-4">
          <Label class="text-right mt-2">Segmentos Salvos</Label>
          <div class="col-span-3 space-y-2">
            <Select
              v-model="selectedSavedSegment"
              @update:model-value="(value) => loadSavedSegment(value, formIndex)"
            >
              <SelectTrigger>
                <SelectValue placeholder="Carregar segmento salvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Segmentos</SelectLabel>
                  <SelectItem
                    v-for="segment in savedSegments"
                    :key="segment.id"
                    :value="segment.id"
                  >
                    {{ segment.name }}
               
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <div class="flex gap-2">
              <Button
                variant="outline"
                @click="clearSelectedSegment"
                :disabled="!selectedSavedSegment"
              >
                <XIcon class="mr-2 h-4 w-4" />
                Limpar Seleção
              </Button>
              <Button variant="outline" @click="clearAllConditions(formIndex)">
                <Trash2Icon class="mr-2 h-4 w-4" />
                Limpar Todas as Condições
              </Button>
            </div>
          </div>
        </div>


        </div>
      </Card>

      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">
          Cancelar
        </Button>
        <Button type="submit" @click="saveSegment" :disabled="isProcessing">
          <Loader2Icon
            v-if="isProcessing"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ isEditing ? "Salvar Alterações" : "Criar Segmento" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import TargetAudience from "@/services/targetAudience";
import Tags from "@/services/tags";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  XIcon,
  Trash2Icon,
  Loader2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
} from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import {Checkbox} from "@/components/ui/checkbox";

const emit = defineEmits(["saved"]);

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const isEditing = ref(false);
const isProcessing = ref(false);
const selectedSavedSegment = ref<number | null>(null);
const savedSegments = ref<Array<any>>([]);
const availableTags = ref([]);
const isSearchingTags = ref(false);
const isLoadingFields = ref(false);
const fields = ref([]);
const responseFieldsFlat = ref([]);
let searchTagsTimeout: any = null;

const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
const months = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
];

const form = ref([
  {
    id: null as number | null,
    name: "",
    description: "",
    dynamic:false,
    condition_groups: [
      {
        logic_operator: "AND",
        conditions: [{ field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
      },
    ],
  },
]);

const getField = (condition: any, groupIndex?: number, formIndex?: number) => {
  if (!condition?.field) return null;
  const [source, fieldKey] = condition.field.split(':');
  const fieldGroup = fields.value.find(g => g.name === source);
  return fieldGroup ? fieldGroup.fields.find((f: any) => f.field_key === fieldKey) : null;
};

const getOperators = (condition: any, groupIndex: number, formIndex: number) => {
  const field = getField(condition);
  return field ? field.operators || [] : [];
};

const showTextInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "string";

const showNumberInput = (condition: any, groupIndex: number, formIndex: number) =>
  ['number', 'integer', 'float', 'numeric'].includes(getField(condition, groupIndex, formIndex)?.data_type);

const showDateInput = (condition: any, groupIndex: number, formIndex: number) =>
  ['date', 'datetime'].includes(getField(condition, groupIndex, formIndex)?.data_type);

const showDayMonthInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "date_md";

const showBooleanInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "boolean";

const fetchTags = async (search = "") => {
  isSearchingTags.value = true;
  try {
    const response = await Tags.index({
      search,
      filter_id: workspaceStore.activeGroupProject?.id,
      per_page: 20,
    });
    availableTags.value = response.data || [];
  } catch (error) {
    console.error("Error loading tags:", error);
  } finally {
    isSearchingTags.value = false;
  }
};

const onSearchTags = (e: any) => {
  const query = e.target.value;
  clearTimeout(searchTagsTimeout);
  searchTagsTimeout = setTimeout(() => {
    fetchTags(query);
  }, 400);
};

const fetchFields = async () => {
  isLoadingFields.value = true;
  try {
    const response = await TargetAudience.getAvailableConditions();
    if (Array.isArray(response)) {
      responseFieldsFlat.value = response;
      const groups = response.reduce((acc: any, field: any) => {
        if (!acc[field.source]) {
          acc[field.source] = { name: field.source, fields: [] };
        }
        acc[field.source].fields.push({
          id: field.id,
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
    console.error("Erro ao carregar campos:", error);
  } finally {
    isLoadingFields.value = false;
  }
};

const addConditionGroup = (index: number) => {
  form.value[index].condition_groups.push({
    logic_operator: "AND",
    conditions: [{ field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
  });
};

const removeConditionGroup = (groupIndex: number, formIndex: number) => {
  if (form.value[formIndex].condition_groups.length > 1) {
    form.value[formIndex].condition_groups.splice(groupIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos um grupo de condições",
      variant: "destructive",
    });
  }
};

const addCondition = (groupIndex: number, formIndex: number) => {
  form.value[formIndex].condition_groups[groupIndex].conditions.push({
    field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0
  });
};

const removeCondition = (groupIndex: number, conditionIndex: number, formIndex: number) => {
  if (form.value[formIndex].condition_groups[groupIndex].conditions.length > 1) {
    form.value[formIndex].condition_groups[groupIndex].conditions.splice(conditionIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const parseDataToForm = (data: any, formIndex: number) => {

  if (data.condition_groups && data.condition_groups.length > 0) {

    form.value[formIndex].condition_groups = data.condition_groups.map((group: any) => ({
      logic_operator: group.logic_operator || 'AND',
      conditions: group.conditions.map((c: any) => {
        let dateValueType = "fixed";
        let dateModifier = "exact";
        let daysOffset = 0;
        let value = c.value;
        const field = responseFieldsFlat.value.find((f: any) => f.id === c.target_audience_condition_field_id);
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
          } else {
            if (typeof c.value === 'string' && c.value.startsWith('{')) {
              try {
                const parsedValue = JSON.parse(c.value);
                if (parsedValue.dateFilter === 'full_date' || parsedValue.dateModifier) {
                  dateValueType = "relative";
                  dateModifier = parsedValue.dateModifier || "exact";
                  daysOffset = parsedValue.daysOffset || 0;
                  value = '';
                }
              } catch (e) {
                console.log('Failed to parse JSON:', e);
              }
            }
          }
        }

        return {
          field: `${field?.source}:${field?.property}`,
          operator: c.operator,
          value: value,
          open: false,
          tagOpen: false,
          dateValueType,
          dateModifier,
          daysOffset
        };
      })
    }));
  } else {
    form.value[formIndex].condition_groups = [{
      logic_operator: "AND",
      conditions: [{ field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
    }];
  }
};

const loadSavedSegment = async (segmentId: number, formIndex: number) => {
  try {
    const data = await TargetAudience.show({ id: segmentId });
    parseDataToForm(data, formIndex);
  } catch (error) {
    console.error("Error loading segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o segmento salvo",
      variant: "destructive",
    });
  }
};

const clearSelectedSegment = () => {
  selectedSavedSegment.value = null;
  resetForm();
};

const clearAllConditions = (formIndex: number) => {
  form.value[formIndex].condition_groups = [
    {
      logic_operator: "AND",
      conditions: [{ field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
    },
  ];
};

const getDayValue = (value: string) => value?.split('-')[1] || '';
const getMonthValue = (value: string) => value?.split('-')[0] || '';
const updateDayMonthValue = (condition: any, type: string, val: string) => {
  let [m, d] = (condition.value || '-').split('-');
  if (type === 'month') m = val;
  if (type === 'day') d = val;
  condition.value = `${m || '01'}-${d || '01'}`;
};

const saveSegment = async () => {
  isProcessing.value = true;
  try {
    const activeGroupProjectId = workspaceStore.activeGroupProject?.id;
    if (form.value.some((f) => !f.name)) throw new Error("O nome do segmento é obrigatório");

    const payload = {
      is_segment: true,
      name: form.value[0].name,
      description: form.value[0].description,
      dynamic: form.value[0].dynamic,
      project_id: workspaceStore.activeGroupProject.project_id,
      condition_groups: form.value[0].condition_groups.map(group => ({
        logic_operator: group.logic_operator,
        conditions: group.conditions.map((c: any) => {
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
            target_audience_condition_field_id:field.id,
            operator: c.operator,
            value: finalValue,
          };
        }).filter(Boolean)
      })).filter(g => g.conditions.length > 0)
    };
    const hasValidConditions = payload.condition_groups.length > 0;
    if (!hasValidConditions) {
      throw new Error("Defina pelo menos uma condição válida.");
    }

    if (isEditing.value && form.value[0].id) {
      await TargetAudience.update(form.value[0].id, payload);
    } else {
      await TargetAudience.store(payload);
    }

    toast({
      title: "Sucesso",
      description: isEditing.value ? "Segmento atualizado com sucesso" : "Segmento criado com sucesso",
    });
    isOpen.value = false;
    emit("saved");
  } catch (error: any) {
    toast({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao salvar o segmento",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const resetForm = () => {
  form.value = [
    {
      id: null,
      name: "",
      description: "",
      dynamic: false,
      condition_groups: [
        {
          logic_operator: "AND",
          conditions: [{ field: "", operator: "", value: "", open: false, tagOpen: false, dateValueType: "fixed", dateModifier: "exact", daysOffset: 0 }],
        },
      ],
    },
  ];
  selectedSavedSegment.value = null;
};

const open = async (segment: any = null, allSegments: any[] = []) => {
  isOpen.value = true;

 await  Promise.all([fetchFields(),
    fetchTags()])
  savedSegments.value = allSegments;
  
  if (segment) {
    isEditing.value = true;
    console.log(segment);
    form.value = [
      {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        condition_groups: [],
        dynamic: segment.dynamic,

      },
    ];
    try {
      isProcessing.value = true;
      const data = await TargetAudience.show({ id: segment.id });
      parseDataToForm(data, 0);

    } catch (error) {
      console.error("Error loading segment:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do segmento",
        variant: "destructive",
      });
      return;
    } finally {
      isProcessing.value = false;
    }
  } else {
    isEditing.value = false;
    resetForm();
  }
};

const importData = (importedForms: any[]) => {
  form.value = importedForms;
  isEditing.value = false;
  isOpen.value = true;
};

watch(
  () => form.value,
  (newForm) => {
    newForm.forEach((seg, formIndex) => {
      seg.condition_groups.forEach((group, groupIndex) => {
        group.conditions.forEach((condition: any) => {
          if (condition.field && condition.operator) {
            const field = getField(condition, groupIndex, formIndex);
            if (field) {
              const validOperators = getOperators(condition, groupIndex, formIndex);
              if (validOperators && !validOperators.includes(condition.operator)) {
                condition.operator = "";
              }
            }
          }
        });
      });
    });
  },
  { deep: true }
);

defineExpose({ open, importData });
</script>