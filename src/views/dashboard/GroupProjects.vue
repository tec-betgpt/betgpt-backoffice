<template>
  <div class="google-analytics-page p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="grid min-[900px]:grid-cols-2 gap-4 pb-10">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Configurações de Projetos</h2>
        <p class="text-muted-foreground">
          Gerencie seus grupos e selecione seu projeto favorito.
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Projetos</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          <div v-if="loading">
            <div class="space-y-4">
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-full" />
              <Skeleton class="h-6 w-full" />
            </div>
          </div>
          <div v-else-if="groups.length">
            <div
              v-for="group in groups"
              :key="group.id"
              class="flex items-center justify-between py-3"
            >
              <div>
                <p class="px-1 font-medium">{{ group.name }}</p>
                <Badge variant="secondary" class="m-1 " v-for="(item, index) in group.projects" :key="index">
                  {{ item.name }}
                </Badge>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grupos de Projetos</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Loader2 as LucideSpinner, LucideStar } from "lucide-vue-next";
import { useWorkspaceStore } from "@/stores/workspace";
import Projects from '@/services/projects'
import UserProjectGroup from '@/services/userProjectGroup'
import CustomDatePicker from "@/components/custom/CustomDatePicker.vue";
import {Card, CardContent} from "@/components/ui/card";

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
      Projects.index(),
      UserProjectGroup.index(),
    ]);

    projects.value = projectsResponse.data;
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
    await UserProjectGroup.destroy(groupId)
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

    const { data } = await UserProjectGroup.store({
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
