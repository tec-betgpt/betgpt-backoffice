<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium">Configurações de Projetos</h3>
      <p class="text-sm text-muted-foreground">
        Gerencie seus grupos e selecione seu projeto favorito.
      </p>
    </div>

    <Separator class="mb-3" />

    <div class="space-y-4">
      <div>
        <h4 class="text-md font-medium mb-2">Grupos de Projetos</h4>
        <div v-if="loading">
          <div class="space-y-4">
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
            <Skeleton class="h-6 w-full" />
          </div>
        </div>
        <div v-else-if="groups.length" class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.id"
            class="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <p class="font-medium">{{ group.name }}</p>
              <p class="text-sm text-muted-foreground">
                Projetos: {{ group.projects.map((p) => p.name).join(", ") }}
              </p>
            </div>
            <div class="flex space-x-2">
              <Button
                v-if="
                  workspaceStore.activeGroupProject?.id !== `group_${group.id}`
                "
                size="sm"
                variant="destructive"
                @click="deleteGroup(group.id)"
                :disabled="deletingGroupId === group.id"
              >
                <LucideSpinner
                  v-if="deletingGroupId === group.id"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                Excluir
              </Button>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-muted-foreground">
          Nenhum grupo criado. Crie um grupo abaixo.
        </p>
      </div>

      <Separator />

      <div class="space-y-3">
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
          <div
            v-else
            class="space-y-2 max-h-72 overflow-y-auto border p-2 rounded-lg mt-2"
          >
            <div
              v-for="project in projects"
              :key="project.id"
              class="flex items-center"
            >
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
        <Button
          @click="createGroup"
          :disabled="creatingGroup"
          variant="outline"
        >
          <LucideSpinner
            v-if="creatingGroup"
            class="mr-2 h-4 w-4 animate-spin"
          />
          Criar Grupo
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner, LucideStar } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import Projects from '@/services/projects'

const { toast } = useToast();
const workspaceStore = useWorkspaceStore();

const loading = ref(false);
const creatingGroup = ref(false);
const groups: any = ref([]);
const projects = ref([]);
const newGroupName = ref("");
const selectedProjects = ref([]);
const deletingGroupId: any = ref(null);

const fetchProjectsAndGroups = async () => {
  loading.value = true;

  try {
    const [projectsResponse, groupsResponse] = await Promise.all([
        Projects.configurationProjects(),
        Projects.configurationProjectGroups(),
    ]);

    projects.value = projectsResponse.data.projects;
    groups.value = groupsResponse.data;
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

const deleteGroup = async (groupId: number) => {
  deletingGroupId.value = groupId;

  try {
    await Projects.removeProjectGroup(groupId)
    groups.value = groups.value.filter((group) => group.id !== groupId);

    toast({
      title: "Sucesso",
      description: "Grupo excluído com sucesso.",
      variant: "success",
    });
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao excluir o grupo.",
      variant: "destructive",
    });
  }

  deletingGroupId.value = null;
};

const createGroup = async () => {
  if (!newGroupName.value.trim()) {
    toast({
      title: "Erro",
      description: "O nome do grupo não pode estar vazio.",
      variant: "destructive",
    });
    return;
  }

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

    const { data } = await Projects.store({
      name: newGroupName.value,
      project_ids: selectedProjects.value,
    })

    groups.value.push(data);
    newGroupName.value = "";
    selectedProjects.value = [];
    toast({
      title: "Sucesso",
      description: "Grupo criado com sucesso.",
      variant: "success",
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

onMounted(fetchProjectsAndGroups);
</script>
