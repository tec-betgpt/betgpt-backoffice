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

        <Separator class="my-4" />

        <div class="space-y-6">
          <div
            v-for="(group, groupIndex) in formItem.conditionGroups"
            :key="groupIndex"
            class="space-y-4"
          >
            <div class="flex items-center justify-between">
              <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
              <Button
                variant="ghost"
                size="sm"
                @click="removeConditionGroup(groupIndex, formIndex)"
                class="text-destructive"
              >
                <Trash2Icon class="h-4 w-4" />
              </Button>
            </div>

            <div class="space-y-1 pl-6 border-l-2 border-muted">
              <template
                v-for="(condition, conditionIndex) in group.conditions"
                :key="conditionIndex"
              >
                <div
                  v-if="conditionIndex > 0"
                  class="flex justify-center h-8"
                >
                  <ToggleGroup
                    v-model="condition.conditionOperator"
                    type="single"
                    variant="outline"
                    class="h-8"
                  >
                    <ToggleGroupItem value="AND" class="h-8 px-3">E</ToggleGroupItem>
                    <ToggleGroupItem value="OR" class="h-8 px-3">OU</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div class="flex items-center gap-2 py-1">
                  <Select
                    v-model="condition.field"
                    class="flex-1 min-w-[120px]"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{{ $t(group.name) }}</SelectLabel>
                        <SelectItem
                          v-for="field in group.fields"
                          :key="field.field_key"
                          :value="field.field_key"
                        >
                          {{ $t(field.label) }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    v-model="condition.operator"
                    class="flex-1 min-w-[120px]"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operador" />
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

                  <Select
                    v-if="getField(condition, groupIndex, formIndex)?.field_key === 'protection_list_type' && !['empty', 'not_empty'].includes(condition.operator)"
                    v-model="condition.value"
                    class="flex-1 min-w-[240px]"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="forced">Forçada</SelectItem>
                      <SelectItem value="exclusion">Exclusão</SelectItem>
                      <SelectItem value="suspensão temporaria">Suspensão Temporária</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    v-else-if="getField(condition, groupIndex, formIndex)?.field_key === 'protection_list' && !['empty', 'not_empty'].includes(condition.operator)"
                    v-model="condition.value"
                    class="flex-1 min-w-[240px]"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saida">Saída</SelectItem>
                      <SelectItem value="Atualizar">Atualizar</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover v-else-if="getField(condition, groupIndex, formIndex)?.field_key === 'tag' && !['empty', 'not_empty'].includes(condition.operator)" v-model:open="condition.tagOpen">
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        role="combobox"
                        :aria-expanded="condition.tagOpen"
                        class="flex-1 min-w-[240px] justify-between text-left font-normal"
                      >
                        {{ availableTags.find(t => t.id === condition.value)?.name || condition.value || 'Selecione uma tag' }}
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
                    v-else-if="
                      showTextInput(condition, groupIndex, formIndex) &&
                      !['empty', 'not_empty'].includes(condition.operator)
                    "
                    v-model="condition.value"
                    placeholder="Valor"
                    class="flex-1 min-w-[240px]"
                  />

                  <Input
                    v-else-if="showNumberInput(condition, groupIndex, formIndex) && !['empty', 'not_empty'].includes(condition.operator)"
                    v-model.number="condition.value"
                    placeholder="Número"
                    type="number"
                    class="flex-1 min-w-[120px]"
                  />

                  <div
                    v-else-if="showDateInput(condition, groupIndex, formIndex) && !['empty', 'not_empty'].includes(condition.operator)"
                    class="flex items-center gap-2 flex-1"
                  >
                    <Select v-model="condition.dateType" class="flex-1">
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tipo</SelectLabel>
                          <SelectItem value="actual_date">Data Atual</SelectItem>
                          <SelectItem value="custom_date">Escolher Data</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <template v-if="condition.dateType === 'custom_date'">
                      <Popover>
                        <PopoverTrigger as-child>
                          <Button variant="outline" class="flex-1">
                            {{ condition.value || "Selecione" }}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0">
                          <Calendar v-model="condition.value" />
                        </PopoverContent>
                      </Popover>
                    </template>

                    <template v-else>
                      <Select v-model="condition.dateModifier">
                        <SelectTrigger>
                          <SelectValue placeholder="Precisão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Precisão</SelectLabel>
                            <SelectItem value="exact">Exatamente</SelectItem>
                            <SelectItem value="plus">Mais</SelectItem>
                            <SelectItem value="minus">Menos</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      <Input
                        v-if="['plus', 'minus'].includes(condition.dateModifier)"
                        v-model.number="condition.daysOffset"
                        type="number"
                        placeholder="Dias"
                        class="w-20"
                        min="0"
                        max="365"
                      />
                    </template>

                    <Select v-model="condition.dateFilter" class="flex-1">
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Filtrar por</SelectLabel>
                          <SelectItem value="full_date">Data Completa</SelectItem>
                          <SelectItem value="m-d">Mês e Dia</SelectItem>
                          <SelectItem value="m">Mês</SelectItem>
                          <SelectItem value="d">Dia</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

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

            <div
              v-if="groupIndex < formItem.conditionGroups.length - 1"
              class="flex justify-center"
            >
              <ToggleGroup
                v-model="group.groupOperator"
                type="single"
                variant="outline"
                class="h-8"
              >
                <ToggleGroupItem value="AND" class="h-8 px-3">E</ToggleGroupItem>
                <ToggleGroupItem value="OR" class="h-8 px-3">OU</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Button variant="outline" @click="addConditionGroup(formIndex)">
            <PlusIcon class="mr-2 h-4 w-4" />
            Adicionar Grupo de Condições
          </Button>
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
                    {{ segment.name }} ({{
                      segment.condition_groups.reduce(
                        (acc, g) => acc + g.conditions.length,
                        0,
                      )
                    }}
                    condições)
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
import Segments from "@/services/segments";
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
import { Calendar } from "@/components/ui/calendar";
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

const emit = defineEmits(["saved"]);

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const isEditing = ref(false);
const isProcessing = ref(false);
const selectedSavedSegment = ref<number | null>(null);
const allFields = ref<Array<any>>([]);
const savedSegments = ref<Array<any>>([]);
const availableTags = ref([]);
const isSearchingTags = ref(false);
let searchTagsTimeout: any = null;

const operatorMap = {
  string: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "not_starts_with",
    "ends_with",
    "not_ends_with",
    "empty",
    "not_empty",
  ],
  number: [
    "equals",
    "not_equals",
    "greater_than",
    "less_than",
    "greater_or_equal",
    "less_or_equal",
    "empty",
    "not_empty",
  ],
  date: [
    "equals",
    "before",
    "after",
    "on_or_before",
    "on_or_after",
    "empty",
    "not_empty",
  ],
  boolean: ["is", "is_not", "empty", "not_empty"],
};

const form = ref([
  {
    id: null as number | null,
    name: "",
    description: "",
    globalOperator: "AND" as "AND" | "OR",
    conditionGroups: [] as Array<any>,
  },
]);

const getField = (condition: any, groupIndex: number, formIndex: number) => {
  const group = form.value[formIndex].conditionGroups[groupIndex];
  return condition?.field
    ? group.fields.find((f: any) => f.field_key === condition.field)
    : null;
};

const getOperators = (condition: any, groupIndex: number, formIndex: number) => {
  const field = getField(condition, groupIndex, formIndex);
  if (!field) return [];

  if (field.field_key === "tag") {
    return ["equals", "not_equals", "empty", "not_empty"];
  }

  if (
    ["protection_list", "protection_list_type"].includes(field.field_key)
  ) {
    return ["equals", "not_equals"];
  }

  return operatorMap[field.data_type as keyof typeof operatorMap] || [];
};

const showTextInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "string";

const showNumberInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "number";

const showDateInput = (condition: any, groupIndex: number, formIndex: number) =>
  getField(condition, groupIndex, formIndex)?.data_type === "date";

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

const resetForm = () => {
  form.value = [
    {
      id: null,
      name: "",
      description: "",
      globalOperator: "AND",
      conditionGroups: allFields.value.map((group) => ({
        name: group.name,
        groupOperator: "AND",
        fields: [...group.fields],
        conditions: [
          {
            conditionOperator: "AND",
            field: "",
            operator: "",
            value: "",
            modifier: "exact",
            tagOpen: false,
          },
        ],
      })),
    },
  ];
  selectedSavedSegment.value = null;
};

const fetchSegmentFields = async () => {
  try {
    const response = await Segments.groups();
    if (Array.isArray(response.data)) {
      allFields.value = response.data.map((group: any) => ({
        name: group.name,
        fields: group.fields.map((field: any) => ({
          ...field,
          field_key: field.field_key || `field_${field.id}`,
        })),
      }));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao carregar campos:", error);
    return false;
  }
};

const addConditionGroup = (index: number) => {
  form.value[index].conditionGroups.push({
    name: allFields.value[0]?.name || "Novo Grupo",
    groupOperator: "AND",
    fields: [...allFields.value.flatMap((g) => g.fields)],
    conditions: [
      {
        conditionOperator: "AND",
        field: "",
        operator: "",
        value: "",
        modifier: "exact",
        tagOpen: false,
      },
    ],
  });
};

const removeConditionGroup = (groupIndex: number, formIndex: number) => {
  if (form.value[formIndex].conditionGroups.length > 1) {
    form.value[formIndex].conditionGroups.splice(groupIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos um grupo de condições",
      variant: "destructive",
    });
  }
};

const addCondition = (groupIndex: number, formIndex: number) => {
  form.value[formIndex].conditionGroups[groupIndex].conditions.push({
    conditionOperator: "AND",
    field: "",
    operator: "",
    value: "",
    modifier: "exact",
    tagOpen: false,
  });
};

const removeCondition = (groupIndex: number, conditionIndex: number, formIndex: number) => {
  if (form.value[formIndex].conditionGroups[groupIndex].conditions.length > 1) {
    form.value[formIndex].conditionGroups[groupIndex].conditions.splice(conditionIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const loadSavedSegment = async (segmentId: number, formIndex: number) => {
  try {
    const segment = savedSegments.value.find((s) => s.id === segmentId);
    if (!segment) return;

    const parseConditionValue = (condition: any) => {
      if (typeof condition.value === "object" && condition.value !== null) return condition.value;
      if (typeof condition.value === "string") {
        try {
          return JSON.parse(condition.value);
        } catch {
          return { value: condition.value };
        }
      }
      return { value: condition.value };
    };

    const newConditionGroups = segment.condition_groups.map((group: any) => ({
      name: "Grupo de Condições",
      groupOperator: group.logic_operator,
      fields: [...allFields.value.flatMap((g) => g.fields)],
      conditions: group.conditions.map((condition: any) => {
        const valueData = parseConditionValue(condition);
        const fieldType = condition.field?.data_type;
        const baseCondition = {
          conditionOperator: condition.logic_operator,
          field: condition.field?.field_key || "",
          operator: condition.operator,
          value: valueData.value?.value || valueData.value,
          modifier: condition.modifier || "exact",
          tagOpen: false,
        };

        if (fieldType === "date") {
          return {
            ...baseCondition,
            dateType: valueData.type || valueData.value?.type || "custom_date",
            dateModifier: valueData.dateModifier || valueData.value?.dateModifier || "exact",
            dateFilter: valueData.dateFilter || valueData.value?.dateFilter || "full_date",
            daysOffset: valueData.daysOffset || valueData.value?.daysOffset || 0,
            value:
              valueData.type === "custom_date" || valueData.value?.type === "custom_date"
                ? valueData.value?.value || valueData.value
                : new Date().toISOString().split("T")[0],
          };
        }
        if (fieldType === "boolean") return { ...baseCondition, value: String(valueData.value) };
        return baseCondition;
      }),
    }));

    form.value[formIndex].conditionGroups =
      newConditionGroups.length > 0 ? newConditionGroups : form.value[formIndex].conditionGroups;
  } catch (error) {
    console.error("Error loading segment:", error);
  }
};

const clearSelectedSegment = () => {
  selectedSavedSegment.value = null;
  resetForm();
};

const clearAllConditions = (formIndex: number) => {
  form.value[formIndex].conditionGroups = [
    {
      name: "Novo Grupo",
      groupOperator: "AND",
      fields: [...allFields.value.flatMap((g) => g.fields)],
      conditions: [
        {
          conditionOperator: "AND",
          field: "",
          operator: "",
          value: "",
          modifier: "exact",
          tagOpen: false,
        },
      ],
    },
  ];
};

const prepareConditionValue = (condition: any, groupIndex: number, formIndex: number) => {
  const field = getField(condition, groupIndex, formIndex);
  if (!field || ["empty", "not_empty"].includes(condition.operator)) return null;

  if (field.data_type === "date") {
    return condition.dateType === "custom_date"
      ? {
          type: "custom_date",
          value: condition.value,
          dateModifier: null,
          dateFilter: "full_date",
          daysOffset: 0,
        }
      : {
          type: "actual_date",
          value: "actual_date",
          dateModifier: condition.dateModifier,
          dateFilter: condition.dateFilter,
          daysOffset: condition.daysOffset || 0,
        };
  }
  return condition.value;
};

const saveSegment = async () => {
  isProcessing.value = true;
  try {
    const activeGroupProjectId = workspaceStore.activeGroupProject?.id;
    if (form.value.some((f) => !f.name)) throw new Error("O nome do segmento é obrigatório");

    const payload = form.value.map((seg, index) => ({
      name: seg.name,
      description: seg.description,
      filter_id: activeGroupProjectId,
      conditions: {
        global_operator: seg.globalOperator,
        groups: seg.conditionGroups.map((group, groupIndex) => ({
          group_operator: group.groupOperator,
          conditions: group.conditions.map((condition: any) => ({
            field: condition.field,
            operator: condition.operator,
            value: ["empty", "not_empty"].includes(condition.operator)
              ? ""
              : prepareConditionValue(condition, groupIndex, index),
            condition_operator: condition.conditionOperator,
            modifier: condition.modifier,
            dateType: condition.dateType,
            dateModifier: condition.dateModifier,
            dateFilter: condition.dateFilter,
            daysOffset: condition.daysOffset,
          })),
        })),
      },
    }));

    if (isEditing.value && form.value[0].id) {
      await Segments.update(form.value[0].id, payload);
    } else {
      await Segments.create(payload);
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

const open = async (segment: any = null, allSegments: any[] = []) => {
  await fetchSegmentFields();
  await fetchTags();
  savedSegments.value = allSegments;
  
  if (segment) {
    isEditing.value = true;
    form.value = [
      {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        globalOperator: "AND",
        conditionGroups: [],
      },
    ];
    selectedSavedSegment.value = segment.id;
    await loadSavedSegment(segment.id, 0);
  } else {
    isEditing.value = false;
    resetForm();
  }
  isOpen.value = true;
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
      seg.conditionGroups.forEach((group, groupIndex) => {
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