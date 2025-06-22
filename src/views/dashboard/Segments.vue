<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Segmentos</h2>
      <p class="text-muted-foreground">
        Crie e gerencie segmentos dinâmicos com regras personalizadas.
      </p>
    </div>

    <Card>
      <CardContent class="py-4">
        <div class="flex justify-between items-center mb-4">
          <Input placeholder="Buscar segmentos..." class="max-w-sm" />
          <Button @click="openCreateModal">
            <PlusIcon class="mr-2 h-4 w-4" />
            Novo Segmento
          </Button>
        </div>

        <CustomDataTable
          :loading="isLoading"
          :data="segments"
          :columns="columns"
        />
      </CardContent>
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
                <div class="flex items-center space-x-2">
                  <Label>Grupo de Condições {{ groupIndex + 1 }}</Label>
                  <Select v-model="group.groupOperator" class="w-24">
                    <SelectTrigger>
                      <SelectValue :placeholder="group.groupOperator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">E (AND)</SelectItem>
                      <SelectItem value="OR">OU (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  @click="removeConditionGroup(groupIndex)"
                  class="text-destructive"
                >
                  <Trash2Icon class="h-4 w-4" />
                </Button>
              </div>

              <div class="space-y-3 pl-6 border-l-2 border-muted">
                <div
                  v-for="(condition, conditionIndex) in group.conditions"
                  :key="conditionIndex"
                  class="flex items-start gap-3"
                >
                  <div class="flex-1 grid grid-cols-12 gap-2">
                    <Select v-model="condition.field" class="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Campo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Campos</SelectLabel>
                          <SelectItem value="created_at"
                            >Data de Criação</SelectItem
                          >
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="name">Nome</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select v-model="condition.operator" class="col-span-3">
                      <SelectTrigger>
                        <SelectValue placeholder="Operador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Operadores</SelectLabel>
                          <SelectItem value="equals">é igual a</SelectItem>
                          <SelectItem value="not_equals"
                            >é diferente de</SelectItem
                          >
                          <SelectItem value="contains">contém</SelectItem>
                          <SelectItem value="not_contains"
                            >não contém</SelectItem
                          >
                          <SelectItem value="starts_with"
                            >começa com</SelectItem
                          >
                          <SelectItem value="ends_with">termina com</SelectItem>
                          <SelectItem value="greater_than"
                            >é maior que</SelectItem
                          >
                          <SelectItem value="less_than">é menor que</SelectItem>
                          <SelectItem value="on_or_after"
                            >está em ou após</SelectItem
                          >
                          <SelectItem value="on_or_before"
                            >está em ou antes</SelectItem
                          >
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <div class="col-span-4 flex gap-2">
                      <Input
                        v-if="!isDateField(condition.field)"
                        v-model="condition.value"
                        placeholder="Valor"
                      />

                      <Popover v-else>
                        <PopoverTrigger as-child>
                          <Button
                            variant="outline"
                            class="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon class="mr-2 h-4 w-4" />
                            {{ condition.value || "Selecione uma data" }}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0">
                          <Calendar v-model="condition.value" />
                        </PopoverContent>
                      </Popover>

                      <Select
                        v-if="isDateField(condition.field)"
                        v-model="condition.modifier"
                        class="w-32"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Modificador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exatamente</SelectItem>
                          <SelectItem value="plus_1_day">+1 dia</SelectItem>
                          <SelectItem value="minus_1_day">-1 dia</SelectItem>
                          <SelectItem value="plus_3_days">+3 dias</SelectItem>
                          <SelectItem value="minus_3_days">-3 dias</SelectItem>
                          <SelectItem value="plus_1_week">+1 semana</SelectItem>
                          <SelectItem value="minus_1_week"
                            >-1 semana</SelectItem
                          >
                        </SelectContent>
                      </Select>
                    </div>

                    <div class="col-span-2 flex items-center">
                      <span
                        v-if="conditionIndex < group.conditions.length - 1"
                        class="text-sm text-muted-foreground"
                      >
                        {{ group.conditionOperator === "AND" ? "E" : "OU" }}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    @click="removeCondition(groupIndex, conditionIndex)"
                    class="text-destructive"
                  >
                    <XIcon class="h-4 w-4" />
                  </Button>
                </div>

                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    @click="addCondition(groupIndex)"
                  >
                    <PlusIcon class="mr-2 h-4 w-4" />
                    Adicionar Condição
                  </Button>

                  <Select v-model="group.conditionOperator" class="w-24">
                    <SelectTrigger>
                      <SelectValue :placeholder="group.conditionOperator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">E (AND)</SelectItem>
                      <SelectItem value="OR">OU (OR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <Button variant="outline" @click="addConditionGroup">
                <PlusIcon class="mr-2 h-4 w-4" />
                Adicionar Grupo de Condições
              </Button>

              <Select v-model="form.globalOperator" class="w-24">
                <SelectTrigger>
                  <SelectValue :placeholder="form.globalOperator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">E (AND)</SelectItem>
                  <SelectItem value="OR">OU (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                      {{ segment.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div class="flex gap-2">
                <Button variant="outline" @click="clearAllConditions">
                  <XIcon class="mr-2 h-4 w-4" />
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
import { ref, onMounted } from "vue";
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
} from "lucide-vue-next";
import CustomDataTable from "@/components/custom/CustomDataTable.vue";

const { toast } = useToast();

const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const selectedSavedSegment = ref(null);

const form = ref({
  id: null,
  name: "",
  description: "",
  globalOperator: "AND",
  conditionGroups: [
    {
      groupOperator: "AND",
      conditionOperator: "AND",
      conditions: [
        {
          field: "",
          operator: "",
          value: "",
          modifier: "exact",
        },
      ],
    },
  ],
});

const segments = ref([]);
const savedSegments = ref([]);

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
    conditionGroups: [
      {
        groupOperator: "AND",
        conditionOperator: "AND",
        conditions: [
          {
            field: "",
            operator: "",
            value: "",
            modifier: "exact",
          },
        ],
      },
    ],
  };
};

const addConditionGroup = () => {
  form.value.conditionGroups.push({
    groupOperator: "AND",
    conditionOperator: "AND",
    conditions: [
      {
        field: "",
        operator: "",
        value: "",
        modifier: "exact",
      },
    ],
  });
};

const removeConditionGroup = (groupIndex) => {
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

const addCondition = (groupIndex) => {
  form.value.conditionGroups[groupIndex].conditions.push({
    field: "",
    operator: "",
    value: "",
    modifier: "exact",
  });
};

const removeCondition = (groupIndex, conditionIndex) => {
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

const isDateField = (field) => {
  return ["created_at", "updated_at"].includes(field);
};

const loadSavedSegment = (segmentId) => {
  const segment = savedSegments.value.find((s) => s.id === segmentId);
  if (segment) {
    form.value.name = segment.name;
    form.value.description = segment.description;
    form.value.conditionGroups = [
      {
        groupOperator: "AND",
        conditionOperator: "AND",
        conditions: [
          {
            field: "created_at",
            operator: "greater_than",
            value: "2023-01-01",
            modifier: "exact",
          },
        ],
      },
    ];
  }
};

const clearAllConditions = () => {
  form.value.conditionGroups = [
    {
      groupOperator: "AND",
      conditionOperator: "AND",
      conditions: [
        {
          field: "",
          operator: "",
          value: "",
          modifier: "exact",
        },
      ],
    },
  ];
};

const saveSegment = async () => {
  isProcessing.value = true;

  try {
    if (!form.value.name) {
      throw new Error("O nome do segmento é obrigatório");
    }

    let hasConditions = false;
    for (const group of form.value.conditionGroups) {
      for (const condition of group.conditions) {
        if (condition.field && condition.operator && condition.value) {
          hasConditions = true;
          break;
        }
      }
      if (hasConditions) break;
    }

    if (!hasConditions) {
      throw new Error("Defina pelo menos uma condição válida");
    }

    if (isEditing.value) {
      toast({
        title: "Sucesso",
        description: "Segmento atualizado com sucesso",
        variant: "default",
      });
    } else {
      const newSegment = {
        id: Math.max(...savedSegments.value.map((s) => s.id)) + 1,
        name: form.value.name,
        description: form.value.description,
      };
      savedSegments.value.push(newSegment);
      segments.value.push(newSegment);

      toast({
        title: "Sucesso",
        description: "Segmento criado com sucesso",
        variant: "default",
      });
    }

    showModal.value = false;
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

const columns = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "conditions",
    header: "Condições",
    cell: ({ row }) => {
      return "X condições em Y grupos";
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return "Ações";
    },
  },
];

onMounted(() => {
  isLoading.value = true;
  setTimeout(() => {
    segments.value = [...savedSegments.value];
    isLoading.value = false;
  }, 500);
});
</script>
