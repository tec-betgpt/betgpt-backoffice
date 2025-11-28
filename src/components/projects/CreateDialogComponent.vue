<template>
  <Button @click="openDialog" class="bg-yellow-300 text-black hover:text-white dark:hover:text-black">
    <Plus />
    Novo Grupo
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Grupos de Projetos</DialogTitle>
        <DialogDescription>
          Adicione um novo grupo selecionando diversos projetos
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3 mt-4">
        <Label for="groupName">Nome do Grupo</Label>
        <Input
          id="groupName"
          v-model="newGroupName"
          placeholder="Digite o nome do grupo"
        />
        <div>
          <Label>Projetos no Grupo</Label>
          <div v-if="loading" class="mt-2">
            <div class="space-y-4">
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-full" />
            </div>
          </div>
          <div v-else class="space-y-2 max-h-72 overflow-y-auto border p-2 rounded-lg mt-2">
            <div v-for="project in projects" :key="project.id" class="flex items-center">
              <Checkbox
                :checked="selectedProjects.includes(project.id)"
                @update:checked="onCheckboxChange(project.id, $event)"
                :id="'project-' + project.id"
              />
              <Label class="ml-2 font-normal" :for="'project-' + project.id">
                {{ project.name }}
              </Label>
            </div>
          </div>
        </div>
        <div class="text-right">
          <Button
            @click="createGroup"
            :disabled="creatingGroup"
            variant="outline"
            class="bg-yellow-400 text-black hover:bg-yellow-500 hover:text-black"
          >
            <LucideSpinner
              v-if="creatingGroup"
              class="mr-2 h-4 w-4 animate-spin"
            />
            Criar Grupo
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import {Dialog} from "@/components/ui/dialog";
import { ref, defineProps, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Plus, Loader2 as LucideSpinner } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import Projects from '@/services/projects'
import UserProjectGroup from '@/services/userProjectGroup'

const props = defineProps<{ reload: () => Promise<void> }>();

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const isDialog = ref(false);
const loading = ref(false);
const creatingGroup = ref(false);
const groups: any = ref([]);
const projects = ref([]);
const newGroupName = ref("");
const selectedProjects = ref([]);
const deletingGroupId: any = ref(null);

const openDialog = async () => {
  isDialog.value = true;
}

const fetchProjects = async () => {
  loading.value = true;

  try {
    const { data } = await Projects.index()
    projects.value = data
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  }

  loading.value = false;
};

const onCheckboxChange = (id: any, checked: any) => {
  if (checked) {
    selectedProjects.value.push(id);
  } else {
    selectedProjects.value = selectedProjects.value.filter((pid) => pid !== id);
  }
};

const createGroup = async () => {
  if (selectedProjects.value.length < 2) {
    toast({
      title: "Erro",
      description: "Selecione no mínimo dois projetos para criar o grupo.",
      variant: "destructive",
    });
    return;
  }

  try {
    creatingGroup.value = true;

    const { data } = await UserProjectGroup.store({
      name: newGroupName.value,
      project_ids: selectedProjects.value,
    })

    groups.value.push(data);
    newGroupName.value = "";
    selectedProjects.value = [];
    isDialog.value = false;
    props.reload();
    toast({
      title: "Sucesso",
      description: "Grupo criado com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao criar grupo.",
      variant: "destructive",
    });
  }

  creatingGroup.value = false;
};

onMounted(() => fetchProjects());
</script>
