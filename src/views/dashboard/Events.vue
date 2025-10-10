<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Eventos</h2>
      <p class="text-muted-foreground">
        Crie e gerencie eventos de conversão com regras personalizadas.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Eventos</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
            :loading="isLoading"
            :data="events"
            :columns="columns"
            :find="fetchEvents"
            :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
      </CardContent>
      <CardFooter class="flex justify-start">
        <div class="flex sm:flex-row flex-col gap-4 my-4 items-center">
          <Button @click="openCreateModal">
            <PlusIcon class="mr-2 h-4 w-4"/>
            Novo Evento
          </Button>
        </div>
      </CardFooter>
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-4xl max-h-[90dvh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Evento" : "Criar Novo Evento" }}
          </DialogTitle>
          <DialogDescription>
            Defina as regras para seu evento de conversão
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 p-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nome do Evento</Label>
            <Input
                id="name"
                v-model="form.name"
                placeholder="Ex: Compra Finalizada"
                class="col-span-3"
                required
            />
          </div>

          <Separator class="my-4"/>

          <div class="space-y-6">
            <div
                v-for="(group, groupIndex) in form.condition_groups"
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
                  <Trash2Icon class="h-4 w-4"/>
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
                        v-model="condition.logic_operator"
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
                        v-model="condition.type"
                        @update:modelValue="onConditionTypeChange(condition)"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Tipos de Condição</SelectLabel>
                          <SelectItem
                              v-for="field in availableConditions"
                              :key="field.type"
                              :value="field.type"
                          >
                            {{ field.name }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select v-model="condition.operator">
                      <SelectTrigger>
                        <SelectValue placeholder="Operador"/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Operadores</SelectLabel>
                          <SelectItem
                              v-for="op in getOperatorsForCondition(condition)"
                              :key="op"
                              :value="op"
                          >
                            {{ operatorTranslations[op] || op }}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <template v-if="condition.type">
                      <Input
                          v-if="getValueTypeForCondition(condition) === 'numeric'"
                          v-model="condition.value.days"
                          placeholder="Dias"
                          class="w-24"
                      />
                      <Combobox
                          by="name"
                          v-if="getValueTypeForCondition(condition) === 'select'"

                      >
                        <ComboboxAnchor>
                          <div class="relative w-full max-w-sm items-center">
                            <ComboboxInput class="pl-9" v-model="condition.value.name"
                                           v-on:update:model-value="s => fetchSegments(s)"
                                           placeholder="Procure pelo Segmento..."/>
                            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                              <Search class="size-4 text-muted-foreground"/>
                            </span>
                          </div>
                        </ComboboxAnchor>
                        <ComboboxList>
                          <ComboboxEmpty>
                            Nenhum Segmento encontrado.
                          </ComboboxEmpty>
                          <ComboboxGroup>
                            <ComboboxItem
                                v-for="segment in segments"
                                :key="segment.id"
                                :value="segment.name">
                              {{segment.name}}
                              <ComboboxItemIndicator>
                                <Check :class="cn('ml-auto h-4 w-4')"/>
                              </ComboboxItemIndicator>
                            </ComboboxItem>
                          </ComboboxGroup>
                        </ComboboxList>
                      </Combobox>
                    </template>

                    <Button
                        v-if="group.conditions.length > 1"
                        variant="ghost"
                        size="sm"
                        @click="removeCondition(groupIndex, conditionIndex)"
                        class="text-destructive"
                    >
                      <Trash2Icon class="h-4 w-4"/>
                    </Button>
                  </div>
                </template>

                <Button
                    variant="outline"
                    size="sm"
                    @click="addCondition(groupIndex)"
                    class="mt-2"
                >
                  <PlusIcon class="mr-2 h-4 w-4"/>
                  Adicionar Condição
                </Button>
              </div>

              <div
                  v-if="groupIndex < form.condition_groups.length - 1"
                  class="flex justify-center"
              >
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

            <Button variant="outline" @click="addConditionGroup">
              <PlusIcon class="mr-2 h-4 w-4"/>
              Adicionar Grupo de Condições
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showModal = false">Cancelar</Button>
          <Button type="submit" @click="saveEvent" :disabled="isProcessing">
            <Loader2Icon
                v-if="isProcessing"
                class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isEditing ? "Salvar Alterações" : "Criar Evento" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, h, onMounted, ref} from "vue";
import Events from "@/services/ConversionEvent";
import {useToast} from "@/components/ui/toast/use-toast";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {ToggleGroup, ToggleGroupItem} from "@/components/ui/toggle-group";
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
import {Check, Loader2Icon, MoreHorizontalIcon, PlusIcon, Search, Trash2Icon} from "lucide-vue-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";
import {createColumnHelper} from "@tanstack/vue-table";
import {useWorkspaceStore} from "@/stores/workspace";
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList
} from "@/components/ui/combobox"
import {cn} from "@/lib/utils";

const {toast} = useToast();
const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const teste = ref(true)
const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(
    () => workspaceStore.activeGroupProject || null
);
const operatorTranslations = {
  "=": "Igual a",
  "!=": "Diferente de",
  ">=": "Maior ou igual a",
  "<": "Menor que",
};

const form = ref({
  id: null as number | null,
  name: "",
  is_primary: false,
  condition_groups: [] as any[],
});

const events = ref<any[]>([]);
const segments = ref<any[]>([]);
const availableConditions = ref<any[]>([]);

const eventColumnHelper = createColumnHelper<any>();

const fetchEvents = async () => {
  try {
    isLoading.value = true;
    const response = await Events.index();
    events.value = response;
  } catch (error) {
    console.error("Error loading events:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os eventos",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const fetchSegments = async (name: string) => {
  try {
    console.log(name)
    const response = await Events.listSegment({find_name:name,filter_id:activeGroupProject?.value.id});

    segments.value = response.data;

  //  segments.value = response.data.segments || [];
  } catch (error) {
    console.error("Error loading segments:", error);
  }
};

const fetchAvailableConditions = async () => {
  try {
    availableConditions.value = await Events.availableConditions();
  } catch (error) {
    console.error("Error loading available conditions:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as condições disponíveis",
      variant: "destructive",
    });
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
    is_primary: false,
    condition_groups: [
      {
        logic_operator: "AND",
        conditions: [
          {
            type: "",
            operator: "",
            value: {},
            logic_operator: "AND",
          },
        ],
      },
    ],
  };
};

const addConditionGroup = () => {
  form.value.condition_groups.push({
    logic_operator: "AND",
    conditions: [
      {
        type: "",
        operator: "",
        value: {},
        logic_operator: "AND",
      },
    ],
  });
};

const removeConditionGroup = (groupIndex: number) => {
  if (form.value.condition_groups.length > 1) {
    form.value.condition_groups.splice(groupIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos um grupo de condições",
      variant: "destructive",
    });
  }
};

const addCondition = (groupIndex: number) => {
  form.value.condition_groups[groupIndex].conditions.push({
    type: "",
    operator: "",
    value: {},
    logic_operator: "AND",
  });
};

const removeCondition = (groupIndex: number, conditionIndex: number) => {
  if (form.value.condition_groups[groupIndex].conditions.length > 1) {
    form.value.condition_groups[groupIndex].conditions.splice(conditionIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const getOperatorsForCondition = (condition: any) => {
  const foundCondition = availableConditions.value.find(
      (c) => c.type === condition.type
  );
  return foundCondition ? foundCondition.operators : [];
};

const getValueTypeForCondition = (condition: any) => {
  const foundCondition = availableConditions.value.find(
      (c) => c.type === condition.type
  );
  return foundCondition ? foundCondition.value_type : "";
};

const onConditionTypeChange = (condition: any) => {
  condition.operator = "";
  condition.value = {};
};

const saveEvent = async () => {
  isProcessing.value = true;

  try {
    if (!form.value.name) {
      throw new Error("O nome do evento é obrigatório");
    }

    const payload = {
      name: form.value.name,
      is_primary: form.value.is_primary,
      condition_groups: form.value.condition_groups.map((group) => ({
        logic_operator: group.logic_operator,
        conditions: group.conditions.map((condition) => ({
          type: condition.type,
          operator: condition.operator,
          value: JSON.stringify(condition.value),
          logic_operator: condition.logic_operator,
        })),
      })),
    };

    if (isEditing.value && form.value.id) {
      await Events.update(form.value.id, payload);
    } else {
      await Events.store(payload);
    }

    await fetchEvents();
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: isEditing.value
          ? "Evento atualizado com sucesso"
          : "Evento criado com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao salvar o evento",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const deleteEvent = async (eventId: number) => {
  try {
    isLoading.value = true;
    await Events.destroy(eventId);
    await fetchEvents();
    toast({
      title: "Sucesso",
      description: "Evento removido com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover o evento",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (event: any) => {
  resetForm();
  isEditing.value = true;
  form.value.id = event.id;
  form.value.name = event.name;
  form.value.is_primary = event.is_primary;
  form.value.condition_groups = event.condition_groups.map((group: any) => ({
    logic_operator: group.logic_operator,
    conditions: group.conditions.map((condition: any) => ({
      type: condition.type,
      operator: condition.operator,
      value: JSON.parse(condition.value),
      logic_operator: condition.logic_operator || "AND",
    })),
  }));
  showModal.value = true;
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
};

const columns = [
  eventColumnHelper.accessor("name", {
    header: "Nome",
    cell: ({row}) => h("div", {}, row.original.name),
  }),
  eventColumnHelper.accessor("is_primary", {
    header: "Primário",
    cell: ({row}) => h("div", {}, row.original.is_primary ? "Sim" : "Não"),
  }),
  {
    accessorKey: "updated_at",
    header: "Editado pela última vez",
    cell: ({row}) => {
      const date = row.original.updated_at;
      return h("div", date ? formatDate(date) : "-");
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({row}) => {
      return h(DropdownMenu, {}, [
        h(
            DropdownMenuTrigger,
            {asChild: true},
            h(
                Button,
                {
                  "aria-haspopup": "true",
                  size: "icon",
                  variant: "ghost",
                  disabled: isLoading.value,
                },
                [
                  h(MoreHorizontalIcon, {class: "h-4 w-4"}),
                  h("span", {class: "sr-only"}, "Ações"),
                ]
            )
        ),
        h(DropdownMenuContent, {align: "end"}, [
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
                onClick: () => deleteEvent(row.original.id),
              },
              h("div", {class: "flex items-center text-destructive"}, "Remover")
          ),
        ]),
      ]);
    },
  },
];

onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchAvailableConditions();
    await fetchEvents();
    resetForm();
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>