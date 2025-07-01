<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Segmentos</h2>
      <p class="text-muted-foreground">
        Crie e gerencie segmentos dinâmicos com regras personalizadas.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Segmentos</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
          :loading="isLoading"
          :data="segments"
          :columns="columns"
          :find="fetchSegments"
          :update-text="handleName"
          :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
      </CardContent>
      <CardFooter class="flex justify-start">
        <div class="flex gap-4 my-4 items-center">
          <Button @click="openCreateModal">
            <PlusIcon class="mr-2 h-4 w-4" />
            Novo Segmento
          </Button>
        </div>
      </CardFooter>
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Segmento" : "Criar Novo Segmento" }}
          </DialogTitle>
          <DialogDescription>
            Defina as regras para seu segmento dinâmico
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nome do Segmento</Label>
            <Input
              id="name"
              v-model="form.name"
              placeholder="Ex: Clientes VIP"
              class="col-span-3"
              required
            />
          </div>

          <div class="grid grid-cols-4 items-start gap-4">
            <Label for="description" class="text-right mt-2">Descrição</Label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="Descrição opcional do segmento"
              class="col-span-3"
              rows="2"
            />
          </div>

          <Separator class="my-4" />

          <div class="space-y-6">
            <div
              v-for="(group, groupIndex) in form.conditionGroups"
              :key="groupIndex"
              class="space-y-4"
            >
              <div class="flex items-center justify-between">
                <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="removeConditionGroup(groupIndex)"
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
                      <ToggleGroupItem value="AND" class="h-8 px-3"
                        >E</ToggleGroupItem
                      >
                      <ToggleGroupItem value="OR" class="h-8 px-3"
                        >OU</ToggleGroupItem
                      >
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
                            v-for="op in getOperators(condition, groupIndex)"
                            :key="op"
                            :value="op"
                          >
                            {{ op }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Input
                      v-if="showTextInput(condition, groupIndex)"
                      v-model="condition.value"
                      placeholder="Valor"
                      class="flex-1 min-w-[240px]"
                    />

                    <Input
                      v-else-if="showNumberInput(condition, groupIndex)"
                      v-model.number="condition.value"
                      placeholder="Número"
                      type="number"
                      class="flex-1"
                    />

                    <div
                      v-else-if="showDateInput(condition, groupIndex)"
                      class="flex items-center gap-2 flex-1"
                    >
                      <Select v-model="condition.dateType" class="flex-1">
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actual_date"
                            >Data Atual</SelectItem
                          >
                          <SelectItem value="custom_date"
                            >Escolher Data</SelectItem
                          >
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
                            <SelectItem value="exact">Exatamente</SelectItem>
                            <SelectItem value="plus">Mais</SelectItem>
                            <SelectItem value="minus">Menos</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          v-if="
                            ['plus', 'minus'].includes(condition.dateModifier)
                          "
                          v-model.number="condition.daysOffset"
                          type="number"
                          placeholder="Dias"
                          class="w-20"
                          min="0"
                          max="365"
                        />
                      </template>
                    </div>

                    <Select
                      v-else-if="showBooleanInput(condition, groupIndex)"
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
                      @click="removeCondition(groupIndex, conditionIndex)"
                      class="text-destructive"
                    >
                      <Trash2Icon class="h-4 w-4" />
                    </Button>
                  </div>
                </template>

                <Button
                  variant="outline"
                  size="sm"
                  @click="addCondition(groupIndex)"
                  class="mt-2"
                >
                  <PlusIcon class="mr-2 h-4 w-4" />
                  Adicionar Condição
                </Button>
              </div>

              <div
                v-if="groupIndex < form.conditionGroups.length - 1"
                class="flex justify-center"
              >
                <ToggleGroup
                  v-model="group.groupOperator"
                  type="single"
                  variant="outline"
                  class="h-8"
                >
                  <ToggleGroupItem value="AND" class="h-8 px-3"
                    >E</ToggleGroupItem
                  >
                  <ToggleGroupItem value="OR" class="h-8 px-3"
                    >OU</ToggleGroupItem
                  >
                </ToggleGroup>
              </div>
            </div>

            <Button variant="outline" @click="addConditionGroup">
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
                @update:model-value="loadSavedSegment"
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
                          0
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
                <Button variant="outline" @click="clearAllConditions">
                  <Trash2Icon class="mr-2 h-4 w-4" />
                  Limpar Todas as Condições
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showModal = false">
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
  </div>
</template>

<script setup lang="ts">
import { h, ref, onMounted, watch } from "vue";
import Segments from "@/services/segments";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  PlusIcon,
  XIcon,
  Trash2Icon,
  Loader2Icon,
  CalendarIcon,
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
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import { useWorkspaceStore } from "@/stores/workspace";
import { createHeaderButton } from "@/components/custom/CustomHeaderButton";
import { createColumnHelper } from "@tanstack/vue-table";

const { toast } = useToast();

const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const selectedSavedSegment = ref<number | null>(null);
const workspaceStore = useWorkspaceStore();
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const operatorMap = {
  string: [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "starts_with",
    "not_starts_with",
    "ends_with",
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
  ],
  date: ["equals", "before", "after", "on_or_before", "on_or_after"],
  boolean: ["is", "is_not"],
};

const form = ref({
  id: null as number | null,
  name: "",
  description: "",
  globalOperator: "AND" as "AND" | "OR",
  conditionGroups: [] as Array<{
    name: string;
    groupOperator: "AND" | "OR";
    fields: Array<{
      field_key: string;
      label: string;
      data_type: string;
      [key: string]: any;
    }>;
    conditions: Array<{
      conditionOperator: "AND" | "OR";
      field: string;
      operator: string;
      value: any;
      modifier?: string;
      dateType?: "actual_date" | "custom_date";
      dateModifier?: string;
      daysOffset?: number;
    }>;
  }>,
});

const segments = ref<Array<any>>([]);
const savedSegments = ref<Array<any>>([]);
const allFields = ref<Array<any>>([]);
const nameSegment = ref();
const orderId = ref("");
const order = ref(false);
const segmentColumnHelper = createColumnHelper<SegmentData>();

interface SegmentData {
  id: number;
  name: string;
  description: string;
}

const getField = (condition: any, groupIndex: number) => {
  const group = form.value.conditionGroups[groupIndex];
  return condition?.field
    ? group.fields.find((f) => f.field_key === condition.field)
    : null;
};

const getOperators = (condition: any, groupIndex: number) => {
  const field = getField(condition, groupIndex);
  return field
    ? operatorMap[field.data_type as keyof typeof operatorMap] || []
    : [];
};

const showTextInput = (condition: any, groupIndex: number) =>
  getField(condition, groupIndex)?.data_type === "string";

const showNumberInput = (condition: any, groupIndex: number) =>
  getField(condition, groupIndex)?.data_type === "number";

const showDateInput = (condition: any, groupIndex: number) =>
  getField(condition, groupIndex)?.data_type === "date";

const showBooleanInput = (condition: any, groupIndex: number) =>
  getField(condition, groupIndex)?.data_type === "boolean";

const fetchSegmentFields = async () => {
  try {
    const response = await Segments.groups();
    if (Array.isArray(response.data)) {
      allFields.value = response.data.map((group) => ({
        name: group.name,
        fields: group.fields.map((field) => ({
          ...field,
          field_key: field.field_key || `field_${field.id}`,
        })),
      }));
      return true;
    }
    throw new Error("Estrutura de dados inesperada");
  } catch (error) {
    console.error("Erro ao carregar campos:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os campos de condição",
      variant: "destructive",
    });
    return false;
  }
};

const openCreateModal = () => {
  resetForm();
  isEditing.value = false;
  showModal.value = true;
};

const resetForm = () => {
  form.value = {
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
        },
      ],
    })),
  };
  selectedSavedSegment.value = null;
};

const updateFormFields = () => {
  form.value.conditionGroups.forEach((group) => {
    group.fields = [...allFields.value.flatMap((g) => g.fields)];
  });
};

const addConditionGroup = () => {
  form.value.conditionGroups.push({
    name: allFields.value[0]?.name || "Novo Grupo",
    groupOperator: "AND",
    fields: [...(allFields.value[0]?.fields || [])],
    conditions: [
      {
        conditionOperator: "AND",
        field: "",
        operator: "",
        value: "",
        modifier: "exact",
      },
    ],
  });
};

const removeConditionGroup = (groupIndex: number) => {
  if (form.value.conditionGroups.length > 1) {
    form.value.conditionGroups.splice(groupIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos um grupo de condições",
      variant: "destructive",
    });
  }
};

const addCondition = (groupIndex: number) => {
  form.value.conditionGroups[groupIndex].conditions.push({
    conditionOperator: "AND",
    field: "",
    operator: "",
    value: "",
    modifier: "exact",
  });
};

const removeCondition = (groupIndex: number, conditionIndex: number) => {
  if (form.value.conditionGroups[groupIndex].conditions.length > 1) {
    form.value.conditionGroups[groupIndex].conditions.splice(conditionIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const loadSavedSegment = async (segmentId: number) => {
  try {
    isLoading.value = true;
    const segment = savedSegments.value.find((s) => s.id === segmentId);
    if (!segment) return;

    const newConditionGroups = segment.condition_groups.map((group) => {
      return {
        name: "Grupo de Condições",
        groupOperator: group.logic_operator,
        fields: [...allFields.value.flatMap((g) => g.fields)],
        conditions: group.conditions.map((condition) => ({
          conditionOperator: condition.logic_operator,
          field: condition.field?.field_key || "",
          operator: condition.operator,
          value: condition.value,
          modifier: condition.modifier || "exact",
          dateType: condition.value_type === "date" ? "custom_date" : undefined,
          dateModifier: condition.modifier || "exact",
          daysOffset: 0,
        })),
      };
    });

    form.value.conditionGroups =
      newConditionGroups.length > 0
        ? newConditionGroups
        : [
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
                },
              ],
            },
          ];

    form.value.conditionGroups.forEach((group, groupIndex) => {
      group.conditions.forEach((condition) => {
        if (condition.field) {
          const validOperators = getOperators(condition, groupIndex);
          if (!validOperators.includes(condition.operator)) {
            condition.operator = "";
          }
        }
      });
    });
  } catch (error) {
    console.error("Error loading segment:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o segmento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const clearSelectedSegment = () => {
  selectedSavedSegment.value = null;
  resetForm();
};

const clearAllConditions = () => {
  form.value.conditionGroups = [
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
        },
      ],
    },
  ];
};

const handleName = (text: string) => {
  nameSegment.value = text;
};

function handlerOrder(column: string, direction: boolean) {
  if (column) {
    orderId.value = column;
    order.value = direction;
  }
  fetchSegments();
}

const fetchSegments = async (current: number = pages.value.current) => {
  try {
    isLoading.value = true;
    const params = {
      page: current,
      filter_id: activeGroupProjectId,
      find_name: nameSegment.value,
      sort_by: orderId.value,
      sort_order: order.value ? "asc" : "desc",
    };
    const response = await Segments.index(params);
    segments.value = response.data.data || [];
    savedSegments.value = [...segments.value];
  } catch (error) {
    console.error("Error loading segments:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os segmentos",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const saveSegment = async () => {
  isProcessing.value = true;
  try {
    if (!form.value.name) {
      throw new Error("O nome do segmento é obrigatório");
    }

    const hasValidConditions = form.value.conditionGroups.some((group) =>
      group.conditions.some(
        (condition) =>
          condition.field && condition.operator && condition.value !== undefined
      )
    );

    if (!hasValidConditions) {
      throw new Error("Defina pelo menos uma condição válida");
    }

    const payload = {
      name: form.value.name,
      description: form.value.description,
      filter_id: activeGroupProjectId,
      conditions: {
        global_operator: form.value.globalOperator,
        groups: form.value.conditionGroups.map((group) => ({
          group_operator: group.groupOperator,
          conditions: group.conditions.map((condition) => ({
            field: condition.field,
            operator: condition.operator,
            value: condition.value,
            condition_operator: condition.conditionOperator,
            modifier: condition.modifier,
          })),
        })),
      },
    };

    if (isEditing.value && form.value.id) {
      await Segments.update(form.value.id, payload);
    } else {
      await Segments.create(payload);
    }

    await fetchSegments();
    selectedSavedSegment.value = null;
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: isEditing.value
        ? "Segmento atualizado com sucesso"
        : "Segmento criado com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao salvar o segmento",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const deleteSegment = async (segmentId: number) => {
  try {
    isLoading.value = true;
    await Segments.delete(segmentId);
    await fetchSegments();
    toast({
      title: "Sucesso",
      description: "Segmento removido com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover o segmento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (segment: any) => {
  isEditing.value = true;
  form.value.id = segment.id;
  form.value.name = segment.name;
  form.value.description = segment.description;
  form.value.globalOperator = "AND";
  selectedSavedSegment.value = segment.id;
  loadSavedSegment(segment.id);
  showModal.value = true;
};

const columns = [
  segmentColumnHelper.accessor("name", {
    header({ column }) {
      return createHeaderButton(
        "Nome",
        "name",
        orderId.value,
        order.value,
        handlerOrder
      );
    },
    cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("name")),
  }),
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "conditions",
    header: "Condições",
    cell: ({ row }) => {
      const conditionGroups = row.original.condition_groups || [];
      const totalConditions = conditionGroups.reduce(
        (acc, group) => acc + (group.conditions?.length || 0),
        0
      );
      return `${totalConditions} condições em ${conditionGroups.length} grupos`;
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return h(DropdownMenu, {}, [
        h(
          DropdownMenuTrigger,
          { asChild: true },
          h(
            Button,
            {
              "aria-haspopup": "true",
              size: "icon",
              variant: "ghost",
              disabled: isLoading.value,
            },
            [
              h(MoreHorizontalIcon, { class: "h-4 w-4" }),
              h("span", { class: "sr-only" }, "Ações"),
            ]
          )
        ),
        h(DropdownMenuContent, { align: "end" }, [
          h(DropdownMenuLabel, {}, "Ações"),
          h(DropdownMenuSeparator, {}),
          h(
            DropdownMenuItem,
            {
              onClick: () => handleEdit(row.original),
            },
            "Editar"
          ),
          h(
            DropdownMenuItem,
            {
              onClick: () => deleteSegment(row.original.id),
            },
            h("div", { class: "flex items-center text-destructive" }, "Remover")
          ),
        ]),
      ]);
    },
  },
];

const pages = ref({
  current: 1,
  total: 0,
  last: 0,
});

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchSegmentFields();
    await fetchSegments();
    resetForm();
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
});

watch(selectedSavedSegment, (newValue) => {
  if (!newValue && showModal.value) {
    resetForm();
  }
});

watch(
  () => form.value.conditionGroups,
  (groups) => {
    groups?.forEach((group, groupIndex) => {
      group?.conditions?.forEach((condition) => {
        if (condition?.field && condition?.operator) {
          const validOperators = getOperators(condition, groupIndex);
          if (validOperators && !validOperators.includes(condition.operator)) {
            condition.operator = "";
          }
        }
      });
    });
  },
  { deep: true }
);
</script>
