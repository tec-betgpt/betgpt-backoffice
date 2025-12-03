<template>
  <Button @click="openDialog()" size="icon" variant="ghost" :disabled="isLoading.show">
    <Spinner v-if="isLoading.show" class="h-4 w-4 animate-spin" />
    <PencilLine v-else />
  </Button>

  <Dialog v-model:open="isDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar Grupo de Projetos</DialogTitle>
        <DialogDescription>
          Modifique um grupo de projeto selecionando diversos projetos
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3 mt-4">
        <Label for="groupName">Nome do Grupo</Label>
        <Input
          id="groupName"
          v-model="name"
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
            @click="onSubmit"
            variant="outline"
            :disabled="creatingGroup"
            class="bg-yellow-400 text-black hover:bg-yellow-500 hover:text-black"
          >
            <LucideSpinner v-if="creatingGroup" class="mr-2 h-4 w-4 animate-spin" />
            Atualizar
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Dialog } from "@/components/ui/dialog";
import { ref, defineProps } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner, PencilLine } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import { Spinner } from "@/components/ui/spinner";
import Projects from '@/services/projects'
import UserProjectGroup from '@/services/userProjectGroup'

const props = defineProps<{ row: any, reload: () => Promise<void> }>();

const { toast } = useToast();

const workspaceStore = useWorkspaceStore();
const isDialog = ref(false);
const isLoading = ref(false);
const loading = ref(false);
const creatingGroup = ref(false);
const projects = ref([]);
const name = ref("");
const selectedProjects = ref<number[]>([]);

const openDialog = async () => {
  isDialog.value = true;
  isLoading.value = true;
  await show();
  await fetchProjects();
  isLoading.value = false;
};

const show = async () => {
  try {
    const data = await UserProjectGroup.show(props.row.id)
    selectedProjects.value = data.projects.map((i: any) => i.id)
    name.value = data.name
  } catch (e) {
    console.error(e);
  }
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

const onCheckboxChange = (id: number, checked: any) => {
  if (checked) {
    selectedProjects.value.push(id);
  } else {
    selectedProjects.value = selectedProjects.value.filter((pid) => pid !== id);
  }
};

const onSubmit = async () => {
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

    const { data } = await UserProjectGroup.update(props.row.id, {
      name: name.value,
      project_ids: selectedProjects.value,
    })

    reset();
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

const reset = () => {
  name.value = "";
  selectedProjects.value = [];
  isDialog.value = false;
}
</script>
