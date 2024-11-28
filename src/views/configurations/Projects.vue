<template>
  <div class="p-6 space-y-6">
    <div>
      <h3 class="text-lg font-medium">Configurações de Projetos</h3>
      <p class="text-sm text-muted-foreground">
        Gerencie seus grupos e selecione seu projeto favorito.
      </p>
    </div>

    <Separator />

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
                size="sm"
                @click="markAsFavorite(group.id)"
                :variant="favoriteGroupId === group.id ? 'success' : 'outline'"
                :disabled="markingFavoriteGroupId === group.id"
              >
                <LucideSpinner
                  v-if="markingFavoriteGroupId === group.id"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                <LucideStar
                  v-else
                  class="mr-2 h-4 w-4"
                  :class="
                    favoriteGroupId === group.id
                      ? 'text-yellow-500'
                      : 'text-muted-foreground'
                  "
                />
                {{
                  favoriteGroupId === group.id
                    ? "Favorito"
                    : markingFavoriteGroupId === group.id
                    ? "Marcar como Favorito"
                    : "Marcar como Favorito"
                }}
              </Button>
              <Button
                v-if="favoriteGroupId !== group.id"
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
        <Button @click="createGroup" :disabled="creatingGroup">
          <LucideSpinner
            v-if="creatingGroup"
            class="mr-2 h-4 w-4 animate-spin"
          />
          Criar Grupo
        </Button>
      </div>
    </div>

    <Separator />

    <div>
      <h4 class="text-md font-medium mb-2">Projeto Favorito</h4>
      <div v-if="loading">
        <div class="space-y-4">
          <Skeleton class="h-6 w-full" />
          <Skeleton class="h-6 w-full" />
        </div>
      </div>
      <div v-else>
        <Select v-model="favoriteProjectId">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecione um projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Button @click="saveSettings" class="mt-4" :disabled="savingSettings">
      <LucideSpinner v-if="savingSettings" class="mr-2 h-4 w-4 animate-spin" />
      Salvar Configurações
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 as LucideSpinner, LucideStar } from "lucide-vue-next";
import { useProjectStore } from "@/stores/project";
import api from "@/services/api";

const { toast } = useToast();
const projectStore = useProjectStore();
const loading = ref(false);
const creatingGroup = ref(false);
const savingSettings = ref(false);
const markingFavoriteGroupId = ref(null);

const groups = ref([]);
const projects = ref([]);
const favoriteGroupId = ref(null);
const favoriteProjectId = ref(null);
const newGroupName = ref("");
const selectedProjects = ref([]);

const fetchProjectsAndGroups = async () => {
  try {
    loading.value = true;
    const [projectsResponse, groupsResponse] = await Promise.all([
      api.get("/user/configurations/projects"),
      api.get("/user/configurations/project-groups"),
    ]);
    projects.value = projectsResponse.data.data.projects;
    groups.value = groupsResponse.data.data;
    favoriteProjectId.value = projectsResponse.data.data.favorite_project_id;
    favoriteGroupId.value = projectsResponse.data.data.favorite_group_id;
    console.log(projects.value);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao carregar os dados.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

const markAsFavorite = async (groupId) => {
  try {
    markingFavoriteGroupId.value = groupId;
    if (favoriteGroupId.value === groupId) {
      await api.patch(
        `/user/configurations/project-groups/${groupId}/unfavorite`
      );
      favoriteGroupId.value = null;

      if (projectStore.selectedProject == `group_${groupId}`) {
        projectStore.setSelectedProject(null);
      }

      toast({
        title: "Sucesso",
        description: "Grupo desfavoritado e exclúido com sucesso.",
        variant: "success",
      });
    } else {
      await api.post(`/user/configurations/project-groups/${groupId}/favorite`);
      favoriteGroupId.value = groupId;
      toast({
        title: "Sucesso",
        description: "Grupo marcado como favorito.",
        variant: "success",
      });
      projectStore.setSelectedProject("group_" + groupId);
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao alterar o estado do favorito.",
      variant: "destructive",
    });
  } finally {
    markingFavoriteGroupId.value = null;
  }
};

const onCheckboxChange = (id: any, checked: any) => {
  if (checked) {
    selectedProjects.value.push(id);
  } else {
    selectedProjects.value = selectedProjects.value.filter((pid) => pid !== id);
  }
};

const deletingGroupId = ref(null);

const deleteGroup = async (groupId) => {
  try {
    deletingGroupId.value = groupId;
    await api.delete(`/user/configurations/project-groups/${groupId}`);
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
  } finally {
    deletingGroupId.value = null;
  }
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
    const response = await api.post("/user/configurations/project-groups", {
      name: newGroupName.value,
      project_ids: selectedProjects.value,
    });
    groups.value.push(response.data.data);
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
  } finally {
    creatingGroup.value = false;
  }
};

const saveSettings = async () => {
  try {
    savingSettings.value = true;
    await api.post("/user/configurations/save-project-preferences", {
      favorite_project_id: favoriteProjectId.value,
    });
    toast({
      title: "Sucesso",
      description: "Configurações salvas com sucesso.",
      variant: "success",
    });
    projectStore.setSelectedProject("project_" + favoriteProjectId.value);
  } catch (error) {
    toast({
      title: "Erro",
      description: "Erro ao salvar configurações.",
      variant: "destructive",
    });
  } finally {
    savingSettings.value = false;
  }
};

onMounted(fetchProjectsAndGroups);
</script>
