import { defineStore } from "pinia";
import { ref } from "vue";
import api from "@/services/base.js";

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    activeGroupProject: null,
    group_projects: [],
  }),
  actions: {
    async setProjects(newGroupProjects) {
      this.group_projects = newGroupProjects;
    },

    async setActiveGroupProject(project) {
      if (!project) return;

      this.activeGroupProject = project;

      try {
        await api.post("/user/configurations/set-project-workspace", {
          group_project: project.id,
        });
      } catch (error) {
        console.error("Erro ao definir o grupo de projeto ativo:", error);
      }
    },

    async loadInitialData(preferences, newGroupProjects) {
      await this.setProjects(newGroupProjects);

      if (
        this.activeGroupProject &&
        this.activeGroupProject.id === preferences.selected_group_project
      ) {
        return;
      }

      const favoriteProject = newGroupProjects.find(
        (project) => project.id === preferences.selected_group_project
      );

      if (favoriteProject) {
        if (
          !this.activeGroupProject ||
          this.activeGroupProject.id !== favoriteProject.id
        ) {
          this.activeGroupProject = favoriteProject;
        }
      } else if (newGroupProjects.length > 0) {
        this.activeGroupProject = newGroupProjects[0];
      }
    },
  },
});
