<script setup lang="ts">
import {ref, onMounted, h} from 'vue'
import targetAudienceService from '@/services/targetAudience'
import CustomDataTable from '@/components/custom/CustomDataTable.vue'
import CustomPagination from '@/components/custom/CustomPagination.vue'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useToast} from '@/components/ui/toast'
import {useWorkspaceStore} from '@/stores/workspace'
import {MoreHorizontal, Trash2Icon, InfoIcon, PlusIcon, Loader2Icon} from "lucide-vue-next";
import CustomEmpty from "@/components/custom/CustomEmpty.vue";
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {useI18n} from "vue-i18n";


const {t} = useI18n();
const targetAudiences = ref({
  data: [],
  meta: {
    current_page: 1,
    last_page: 1,
    total: 0,
  },
})
const loading = ref(false)
const loadingTarget = ref(false)
const {toast} = useToast()
const workspaceStore = useWorkspaceStore()
const activeGroupProjectId = workspaceStore.activeGroupProject?.id ?? null;

const columns = [
  {accessorKey: 'name', header: 'Nome'},
  {accessorKey: 'description', header: 'Descrição'},
  {
    accessorKey: 'actions',
    header: 'Ações',
    cell: ({row}) =>
        h(DropdownMenu, {}, [
          h(
              DropdownMenuTrigger,
              {asChild: true},
              h(
                  Button,
                  {size: "icon", variant: "ghost"},
                  [
                    h(MoreHorizontal, {class: "h-4 w-4"}),
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
                  onClick: () => {
                    openEditDialog(row.original)
                  },
                },
                "Editar"
            ),
            h(
                DropdownMenuItem,
                {
                  onClick: () => {
                    handleDelete(row.original)
                  },
                },
                "Deletar"
            ),
          ]),
        ]),
  },
]

const isCreateDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isProcessing = ref(false);

const targetAudienceFields = ref([]);

const newTargetAudience = ref({
  name: '',
  description: '',
  membership_duration: null as number | null,
  project_id: activeGroupProjectId,
  conditionGroups: [{
    groupOperator: 'AND',
    conditions: [{conditionOperator: 'AND', field: '', operator: '', value: ''}]
  }],
});

const editableTargetAudience = ref({
  id: null as number | null,
  name: '',
  description: '',
  membership_duration: null as number | null,
  conditionGroups: [{
    groupOperator: 'AND',
    conditions: [{conditionOperator: 'AND', field: '', operator: '', value: ''}]
  }],
});

function getAudienceFormRef(isEditingForm: boolean) {
  return isEditingForm ? editableTargetAudience.value : newTargetAudience.value;
}

const getTaField = (condition: any) => {
  const allTaFields = targetAudienceFields.value.flatMap(g => g.fields);
  return condition?.field
      ? allTaFields.find((f) => f.field_key === condition.field)
      : null;
};

const getTaOperators = (condition: any) => {
  const field = getTaField(condition);
  return field ? field.operators || [] : [];
};

const showTaTextInput = (condition: any) => getTaField(condition)?.data_type === 'string';
const showTaNumberInput = (condition: any) => getTaField(condition)?.data_type === 'number';
const showTaBooleanInput = (condition: any) => getTaField(condition)?.data_type === 'boolean';


const addTaCondition = (isEditingForm: boolean = false) => {
  const form = getAudienceFormRef(isEditingForm);
  // Since we only have one group, we add to conditions of group 0
  form.conditionGroups[0].conditions.push({
    conditionOperator: "AND",
    field: "",
    operator: "",
    value: "",
  });
};

const removeTaCondition = (conditionIndex: number, isEditingForm: boolean = false) => {
  const form = getAudienceFormRef(isEditingForm);
  const conditions = form.conditionGroups[0].conditions;
  if (conditions.length > 1) {
    conditions.splice(conditionIndex, 1);
  } else {
    toast({
      title: "Aviso",
      description: "Você deve ter pelo menos uma condição no grupo",
      variant: "destructive",
    });
  }
};

const fetchTargetAudienceFields = async () => {
  try {
    const response = await targetAudienceService.getAvailableConditions();
    if (Array.isArray(response)) {
      const groups = response.reduce((acc, field) => {
        if (!acc[field.source]) {
          acc[field.source] = {name: field.source, fields: []};
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
      throw new Error("Estrutura de dados inesperada para campos de público alvo");
    }
  } catch (error) {
    console.error("Erro ao carregar campos de público alvo:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar os campos para o público alvo.",
      variant: "destructive",
    });
  }
};


const fetchTargetAudiences = async (page = 1) => {
  loading.value = true
  try {
    const response = await targetAudienceService.index({page, filter_id: activeGroupProjectId})
    targetAudiences.value = {
      data: response,
      meta: {
        current_page: response.current_page,
        last_page: response.last_page,
        total: response.total,
      },
    }
  } catch (error) {
    toast({
      title: 'Erro',
      description: 'Não foi possível carregar as audiências.',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

const resetNewTargetAudienceForm = () => {
  newTargetAudience.value = {
    name: '',
    description: '',
    membership_duration: null,
    project_id: activeGroupProjectId,
    conditionGroups: [{
      groupOperator: 'AND',
      conditions: [{conditionOperator: 'AND', field: '', operator: '', value: ''}]
    }],
  };
};

const resetEditableTargetAudienceForm = () => {
  editableTargetAudience.value = {
    id: null,
    name: '',
    description: '',
    membership_duration: null,
    conditionGroups: [{
      groupOperator: 'AND',
      conditions: [{conditionOperator: 'AND', field: '', operator: '', value: ''}]
    }],
  };
};

const handleCreate = async () => {
  isProcessing.value = true;
  try {
    if (!newTargetAudience.value.name) throw new Error("O nome é obrigatório.");
    if (!activeGroupProjectId) throw new Error("Projeto não selecionado.");

    const conditionsPayload = newTargetAudience.value.conditionGroups.flatMap(group =>
        group.conditions.map(c => {
          const field = getTaField(c);
          if (!field || !c.field || !c.operator) return null;
          if (!['empty', 'not_empty'].includes(c.operator) && !c.value && c.value !== 0) return null;
          return {
            source: field.source,
            property: c.field,
            operator: c.operator,
            value: c.value
          };
        }).filter(Boolean)
    );

    if (conditionsPayload.length === 0) throw new Error("Defina pelo menos uma condição válida.");

    const payload = {
      name: newTargetAudience.value.name,
      description: newTargetAudience.value.description,
      membership_duration: newTargetAudience.value.membership_duration,
      project_id: activeGroupProjectId,
      conditions: conditionsPayload,
    };

    await targetAudienceService.store(payload);
    toast({title: 'Sucesso', description: 'Audiência criada com sucesso.'});
    isCreateDialogOpen.value = false;
    await fetchTargetAudiences();
  } catch (error: any) {
    console.error("Error creating audience:", error);
    toast({
      title: 'Erro',
      description: error.message || 'Não foi possível criar a audiência.',
      variant: 'destructive',
    });
  } finally {
    isProcessing.value = false;
  }
};

const openEditDialog = async (item: any) => {
  try {
    loadingTarget.value = true;
    const response = await targetAudienceService.show({id: item.id});

    resetEditableTargetAudienceForm();

    editableTargetAudience.value.id = response.id;
    editableTargetAudience.value.name = response.name;
    editableTargetAudience.value.description = response.description;
    editableTargetAudience.value.membership_duration = response.membership_duration;

    if (response.conditions && response.conditions.length > 0) {
      editableTargetAudience.value.conditionGroups = [{
        groupOperator: 'AND',
        conditions: response.conditions.map((c: any) => ({
          conditionOperator: 'AND',
          field: c.property,
          operator: c.operator,
          value: c.value,
        }))
      }];
    } else {
      editableTargetAudience.value.conditionGroups = [{
        groupOperator: 'AND',
        conditions: [{conditionOperator: 'AND', field: '', operator: '', value: ''}]
      }];
    }
    isEditDialogOpen.value = true;
  } catch (error: any) {
    console.error(error);
    toast({
      title: 'Erro',
      description: error.message || 'Não foi possível carregar os dados do público alvo.',
      variant: 'destructive',
    });
  } finally {
    loadingTarget.value = false;
  }
};

const handleUpdate = async () => {
  isProcessing.value = true;
  if (!editableTargetAudience.value.id) {
    isProcessing.value = false;
    return;
  }

  try {
    if (!editableTargetAudience.value.name) throw new Error("O nome é obrigatório.");

    const conditionsPayload = editableTargetAudience.value.conditionGroups.flatMap(group =>
        group.conditions.map(c => {
          const field = getTaField(c);
          if (!field || !c.field || !c.operator) return null;
          if (!['empty', 'not_empty'].includes(c.operator) && !c.value && c.value !== 0) return null;
          return {
            source: field.source,
            property: c.field,
            operator: c.operator,
            value: c.value
          };
        }).filter(Boolean)
    );

    if (conditionsPayload.length === 0) throw new Error("Defina pelo menos uma condição válida.");

    const payload = {
      name: editableTargetAudience.value.name,
      description: editableTargetAudience.value.description,
      membership_duration: editableTargetAudience.value.membership_duration,
      conditions: conditionsPayload,
    };

    await targetAudienceService.update(editableTargetAudience.value.id, payload);
    toast({title: 'Sucesso', description: 'Audiência atualizada com sucesso.'});
    isEditDialogOpen.value = false;
    await fetchTargetAudiences();
  } catch (error: any) {
    console.error("Error updating audience:", error);
    toast({
      title: 'Erro',
      description: error.message || 'Não foi possível atualizar a audiência.',
      variant: 'destructive',
    });
  } finally {
    isProcessing.value = false;
  }
};


const handleDelete = async (item: any) => {
  try {
    await targetAudienceService.destroy(item.id)
    toast({
      title: 'Sucesso',
      description: 'Audiência deletada com sucesso.',
    })
    await fetchTargetAudiences()
  } catch (error: any) {
    toast({
      title: 'Erro',
      description: error.message || 'Não foi possível deletar a audiência.',
      variant: 'destructive',
    })
  }
}

onMounted(async () => {
  await fetchTargetAudienceFields();
  await fetchTargetAudiences();
})
</script>


<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold">Público Alvo</h1>
      <Button @click="() => { resetNewTargetAudienceForm(); isCreateDialogOpen = true; }">
        <PlusIcon class="mr-2 h-4 w-4"/>
        Novo Público Alvo
      </Button>
    </div>

    <CustomDataTable v-if="targetAudiences.data.length" :columns="columns"
                     :data="targetAudiences.data" :loading="loading"/>
    <CustomEmpty v-else buttonText="Criar público alvo"
                 :show-button="true"
                 @buttonClick="() => { resetNewTargetAudienceForm(); isCreateDialogOpen = true; }"
                 title="Sem Público Alvo"
                 description="Você ainda não criou nenhum público alvo. Comece criando seu primeiro público alvo."/>
    <CustomPagination
        v-if="targetAudiences.data && targetAudiences.data.length"
        :pages="{current:targetAudiences.meta.current_page,total:targetAudiences.meta.total,last:targetAudiences.meta.last_page}"
        per_pages="15"
        :select-page="fetchTargetAudiences"
    />
    <!-- Edit Dialog -->
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Público Alvo</DialogTitle>
          <DialogDescription>
            Faça alterações no seu público alvo aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-name" class="text-right">
              Nome
            </Label>
            <Input id="edit-name" v-model="editableTargetAudience.name" class="col-span-3"/>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-description" class="text-right">
              Descrição
            </Label>
            <Input id="edit-description" v-model="editableTargetAudience.description" class="col-span-3"/>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <div class="text-right flex items-center justify-end gap-1">
              <Label for="edit-ta-duration">Duração da Adesão</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon class="h-4 w-4 text-muted-foreground"/>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Número de dias que um contato permanecerá no público.<br>Deixe em branco para adesão permanente.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input id="edit-ta-duration" type="number" v-model.number="editableTargetAudience.membership_duration"
                   placeholder="Permanente" class="col-span-3"/>
          </div>
          <div class="col-span-4 mt-4">
            <Label class="font-semibold">Condições</Label>
            <div v-for="(group, groupIndex) in editableTargetAudience.conditionGroups" :key="groupIndex">
              <div v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex"
                   class="flex items-center gap-2 my-2 p-2 border rounded-md">
                <Select v-model="condition.field" class="flex-1 min-w-[120px]">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um campo"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup v-for="fieldGroup in targetAudienceFields" :key="fieldGroup.name">
                      <SelectLabel>{{ t(fieldGroup.name) }}</SelectLabel>
                      <SelectItem v-for="field in fieldGroup.fields" :key="field.field_key" :value="field.field_key">
                        {{ t(field.label) }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select v-model="condition.operator" class="flex-1 min-w-[120px]">
                  <SelectTrigger>
                    <SelectValue placeholder="Operador"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Operadores</SelectLabel>
                      <SelectItem v-for="op in getTaOperators(condition)" :key="op" :value="op">
                        {{ t(op) }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Input
                    v-if="showTaTextInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"
                    v-model="condition.value"
                    placeholder="Valor"
                    class="flex-1"
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
                    <SelectValue placeholder="Selecione"/>
                  </SelectTrigger>


                  <SelectContent>


                    <SelectItem value="true">Sim</SelectItem>


                    <SelectItem value="false">Não</SelectItem>


                  </SelectContent>


                </Select>


                <Button variant="ghost" size="icon" @click="removeTaCondition(conditionIndex, true)"
                        class="text-destructive">


                  <Trash2Icon class="h-4 w-4"/>


                </Button>


              </div>


              <Button variant="outline" size="sm" @click="addTaCondition(true)" class="mt-2">Adicionar Condição</Button>


            </div>


          </div>


        </div>


        <DialogFooter>


          <Button variant="outline" @click="isEditDialogOpen = false">Cancelar</Button>


          <Button @click="handleUpdate" :disabled="isProcessing">


            <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin"/>


            Salvar Alterações


          </Button>


        </DialogFooter>


      </DialogContent>


    </Dialog>


    <!-- Create Dialog -->


    <Dialog v-model:open="isCreateDialogOpen">


      <DialogContent class="sm:max-w-4xl">


        <DialogHeader>


          <DialogTitle>Criar Novo Público Alvo</DialogTitle>


          <DialogDescription>


            Defina um nome, descrição e as condições para o seu novo público.


          </DialogDescription>


        </DialogHeader>


        <div class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">


          <div class="grid grid-cols-4 items-center gap-4">


            <Label for="create-name" class="text-right">


              Nome


            </Label>


            <Input id="create-name" v-model="newTargetAudience.name" class="col-span-3"/>


          </div>


          <div class="grid grid-cols-4 items-center gap-4">


            <Label for="create-description" class="text-right">


              Descrição


            </Label>


            <Input id="create-description" v-model="newTargetAudience.description" class="col-span-3"/>


          </div>


          <div class="grid grid-cols-4 items-center gap-4">


            <div class="text-right flex items-center justify-end gap-1">


              <Label for="create-ta-duration">Duração da Adesão</Label>


              <TooltipProvider>


                <Tooltip>


                  <TooltipTrigger>


                    <InfoIcon class="h-4 w-4 text-muted-foreground"/>


                  </TooltipTrigger>


                  <TooltipContent>


                    <p>Número de dias que um contato permanecerá no público.<br>Deixe em branco para adesão permanente.
                    </p>


                  </TooltipContent>


                </Tooltip>


              </TooltipProvider>


            </div>


            <Input id="create-ta-duration" type="number" v-model.number="newTargetAudience.membership_duration"
                   placeholder="Permanente" class="col-span-3"/>


          </div>


          <div class="col-span-4 mt-4">


            <Label class="font-semibold">Condições</Label>


            <div v-for="(group, groupIndex) in newTargetAudience.conditionGroups" :key="groupIndex">


              <div v-for="(condition, conditionIndex) in group.conditions" :key="conditionIndex"
                   class="flex items-center gap-2 my-2 p-2 border rounded-md">


                <Select v-model="condition.field" class="flex-1 min-w-[120px]">


                  <SelectTrigger>


                    <SelectValue placeholder="Selecione um campo"/>


                  </SelectTrigger>


                  <SelectContent>


                    <SelectGroup v-for="fieldGroup in targetAudienceFields" :key="fieldGroup.name">


                      <SelectLabel>{{ t(fieldGroup.name) }}</SelectLabel>


                      <SelectItem v-for="field in fieldGroup.fields" :key="field.field_key" :value="field.field_key">


                        {{ t(field.label) }}


                      </SelectItem>


                    </SelectGroup>


                  </SelectContent>


                </Select>


                <Select v-model="condition.operator" class="flex-1 min-w-[120px]">


                  <SelectTrigger>


                    <SelectValue placeholder="Operador"/>


                  </SelectTrigger>


                  <SelectContent>


                    <SelectGroup>


                      <SelectLabel>Operadores</SelectLabel>


                      <SelectItem v-for="op in getTaOperators(condition)" :key="op" :value="op">


                        {{ t(op) }}


                      </SelectItem>


                    </SelectGroup>


                  </SelectContent>


                </Select>


                <Input


                    v-if="showTaTextInput(condition) && !['empty', 'not_empty'].includes(condition.operator)"


                    v-model="condition.value"


                    placeholder="Valor"


                    class="flex-1"


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
                    <SelectValue placeholder="Selecione"/>
                  </SelectTrigger>


                  <SelectContent>


                    <SelectItem value="true">Sim</SelectItem>


                    <SelectItem value="false">Não</SelectItem>


                  </SelectContent>


                </Select>


                <Button variant="ghost" size="icon" @click="removeTaCondition(conditionIndex, false)"
                        class="text-destructive">


                  <Trash2Icon class="h-4 w-4"/>


                </Button>


              </div>


              <Button variant="outline" size="sm" @click="addTaCondition(false)" class="mt-2">Adicionar Condição
              </Button>


            </div>


          </div>


        </div>


        <DialogFooter>


          <Button variant="outline" @click="isCreateDialogOpen = false">Cancelar</Button>


          <Button @click="handleCreate" :disabled="isProcessing">


            <Loader2Icon v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin"/>


            Criar


          </Button>


        </DialogFooter>


      </DialogContent>


    </Dialog>


  </div>


</template>

