import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/api";

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    activeProject: null,
    projects: [],
  }),
  actions: {
    async setProjects(newProjects) {
      this.projects = newProjects;
    },

    async setActiveProject(project) {
      if (!project) return;

      console.log(project);
      this.activeProject = project;

      try {
        await api.post("/user/configurations/set-project-workspace", {
          project_uuid: project.uuid,
        });
      } catch (error) {
        console.error("Erro ao definir o projeto ativo:", error);
      }
    },

    async loadInitialData(preferences, newProjects) {
      await this.setProjects(newProjects);

      if (
        this.activeProject &&
        this.activeProject.id === preferences.favorite_project_id
      ) {
        return;
      }

      const favoriteProject = newProjects.find(
        (project) => project.id === preferences.favorite_project_id
      );

      if (favoriteProject) {
        if (
          !this.activeProject ||
          this.activeProject.id !== favoriteProject.id
        ) {
          this.activeProject = favoriteProject;
        }
      } else if (newProjects.length > 0) {
        this.activeProject = newProjects[0];
      }
    },
  },
});
