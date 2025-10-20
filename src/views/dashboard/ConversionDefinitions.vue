<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Gerenciar Definições de Conversão</h2>
      <p class="text-muted-foreground">
        Crie e gerencie definições de conversão com regras personalizadas.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Definições de Conversão</CardTitle>
      </CardHeader>
      <CardContent class="py-4">
        <CustomDataTable
            :loading="isLoading"
            :data="conversionDefinitions"
            :columns="columns"
            :find="fetchConversionDefinitions"
            :search-fields="[{ key: 'name', placeholder: 'Buscar por nome...' }]"
        />
      </CardContent>
      <CardFooter class="flex justify-start">
        <div class="flex sm:flex-row flex-col gap-4 my-4 items-center">
          <Button @click="openCreateModal">
            <PlusIcon class="mr-2 h-4 w-4"/>
            Nova Definição de Conversão
          </Button>
        </div>
      </CardFooter>
    </Card>

    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-2xl max-h-[90dvh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>
            {{ isEditing ? "Editar Definição de Conversão" : "Criar Nova Definição de Conversão" }}
          </DialogTitle>
          <DialogDescription>
            Defina as regras para sua definição de conversão.
          </DialogDescription>
        </DialogHeader>

        <div class="grid gap-4 p-4">
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
            <Input
                id="description"
                v-model="form.description"
                placeholder="Ex: Dispara quando um usuário faz a primeira compra."
                class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="conversion_value_field" class="text-right">Campo de Valor</Label>
            <Input
                id="conversion_value_field"
                v-model="form.conversion_value_field"
                placeholder="Ex: deposit_value"
                class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_primary" class="text-right">Primário</Label>
            <Switch id="is_primary" v-model="form.is_primary" class="col-span-3"/>
          </div>

          <Separator class="my-4"/>

          <div class="space-y-4">
            <Label>Condições</Label>
            <div
                v-for="(condition, index) in form.conditions"
                :key="index"
                class="flex items-center gap-2"
            >
              <Combobox v-model="condition.conditionable_id" class="w-full">
                <ComboboxAnchor>
                  <div class="relative w-full max-w-sm items-center">
                    <ComboboxInput
                        class="pl-9"
                        v-on:update:model-value="s => fetchSegments(s)"
                        placeholder="Procure pelo Segmento..."
                    />
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
                        :value="segment.id">
                      {{ segment.name }}
                      <ComboboxItemIndicator>
                        <Check :class="cn('ml-auto h-4 w-4')"/>
                      </ComboboxItemIndicator>
                    </ComboboxItem>
                  </ComboboxGroup>
                </ComboboxList>
              </Combobox>
              <Button
                  variant="ghost"
                  size="sm"
                  @click="removeCondition(index)"
                  class="text-destructive"
              >
                <Trash2Icon class="h-4 w-4"/>
              </Button>
            </div>
            <Button
                variant="outline"
                size="sm"
                @click="addCondition"
                class="mt-2"
            >
              <PlusIcon class="mr-2 h-4 w-4"/>
              Adicionar Condição
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showModal = false">Cancelar</Button>
          <Button type="submit" @click="saveConversionDefinition" :disabled="isProcessing">
            <Loader2Icon
                v-if="isProcessing"
                class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isEditing ? "Salvar Alterações" : "Criar Definição" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, h, onMounted, ref} from "vue";
import ConversionDefinitions from "@/services/conversionDefinitions";
import Segments from "@/services/segments";
import {useToast} from "@/components/ui/toast/use-toast";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card, CardContent, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {Switch} from "@/components/ui/switch";

const {toast} = useToast();
const isLoading = ref(false);
const isProcessing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(
    () => workspaceStore.activeGroupProject || null
);

const form = ref({
  id: null as number | null,
  name: "",
  description: "",
  is_primary: false,
  conversion_value_field: "",
  conditions: [] as any[],
});

const conversionDefinitions = ref<any[]>([]);
const segments = ref<any[]>([]);

const columnHelper = createColumnHelper<any>();

const fetchConversionDefinitions = async () => {
  try {
    isLoading.value = true;
    const response = await ConversionDefinitions.index({filter_id: activeGroupProject.value.id});
    conversionDefinitions.value = response.data;
  } catch (error) {
    console.error("Error loading conversion definitions:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar as definições de conversão",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const fetchSegments = async (name: string) => {
  try {
    const response = await Segments.index({find_name: name, filter_id: activeGroupProject?.value.id});
    segments.value = response.data;
  } catch (error) {
    console.error("Error loading segments:", error);
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
    is_primary: false,
    conversion_value_field: "",
    conditions: [],
  };
};

const addCondition = () => {
  form.value.conditions.push({
    conditionable_type: "segment",
    conditionable_id: null,
  });
};

const removeCondition = (index: number) => {
  form.value.conditions.splice(index, 1);
};

const saveConversionDefinition = async () => {
  isProcessing.value = true;

  try {
    if (!form.value.name) {
      throw new Error("O nome da definição de conversão é obrigatório");
    }

    const payload = {
      name: form.value.name,
      description: form.value.description,
      type: "segment_membership",
      is_primary: form.value.is_primary,
      project_id: activeGroupProject.value.id,
      conversion_value_field: form.value.conversion_value_field,
      conditions: form.value.conditions.filter(c => c.conditionable_id),
    };

    if (isEditing.value && form.value.id) {
      await ConversionDefinitions.update(form.value.id, payload);
    } else {
      await ConversionDefinitions.store(payload);
    }

    await fetchConversionDefinitions();
    showModal.value = false;
    toast({
      title: "Sucesso",
      description: isEditing.value
          ? "Definição de conversão atualizada com sucesso"
          : "Definição de conversão criada com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: error.message || "Ocorreu um erro ao salvar a definição de conversão",
      variant: "destructive",
    });
  } finally {
    isProcessing.value = false;
  }
};

const deleteConversionDefinition = async (id: number) => {
  try {
    isLoading.value = true;
    await ConversionDefinitions.destroy(id);
    await fetchConversionDefinitions();
    toast({
      title: "Sucesso",
      description: "Definição de conversão removida com sucesso",
      variant: "default",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Não foi possível remover a definição de conversão",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (definition: any) => {
  resetForm();
  isEditing.value = true;
  form.value.id = definition.id;
  form.value.name = definition.name;
  form.value.description = definition.description;
  form.value.is_primary = definition.is_primary;
  form.value.conversion_value_field = definition.conversion_value_field;
  form.value.conditions = definition.conditions.map((c: any) => ({
    conditionable_type: "segment",
    conditionable_id: c.conditionable_id,
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
  columnHelper.accessor("name", {
    header: "Nome",
    cell: ({row}) => h("div", {}, row.original.name),
  }),
  columnHelper.accessor("is_primary", {
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
                onClick: () => deleteConversionDefinition(row.original.id),
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
    await fetchConversionDefinitions();
    await fetchSegments('');
    resetForm();
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>