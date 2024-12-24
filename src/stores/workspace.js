import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

export const useWorkspaceStore = defineStore("workspace", () => {
  const activeProject = ref(null);
  const projects = ref([]);

  async function setProjects(newProjects) {
    projects.value = newProjects;
  }

  async function setActiveProject(project) {
    if (!project) return;

    activeProject.value = project;

    try {
      await api.post("/user/configurations/set-project-workspace", {
        project_uuid: project.uuid,
      });
    } catch (error) {
      console.error("Erro ao definir o projeto ativo:", error);
    }
  }

  async function loadInitialData(preferences, newProjects) {
    await setProjects(newProjects);

    if (
      activeProject.value &&
      activeProject.value.id === preferences.favorite_project_id
    ) {
      return;
    }

    const favoriteProject = newProjects.find(
      (project) => project.id === preferences.favorite_project_id
    );

    if (favoriteProject) {
      if (
        !activeProject.value ||
        activeProject.value.id !== favoriteProject.id
      ) {
        activeProject.value = favoriteProject;
      }
    } else if (newProjects.length > 0) {
      activeProject.value = newProjects[0];
    }
  }

  return {
    activeProject,
    projects,
    setProjects,
    setActiveProject,
    loadInitialData,
  };
});
