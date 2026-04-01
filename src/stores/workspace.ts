import { defineStore } from "pinia";
import UserProjectGroup from "@/services/userProjectGroup";

interface ActiveGroupProject {
  id: string
  is_selected: boolean
  label: string
  logo: string | null
  name: string
  type: "group" | "project"
}

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    activeGroupProject: null as ActiveGroupProject | null,
    group_projects: [],
    lastAnnotationUpdate: null as number | null,
  }),
  actions: {
    notifyAnnotationUpdate() {
      this.lastAnnotationUpdate = Date.now();
    },

    async setProjects(newGroupProjects: any) {
      this.group_projects = newGroupProjects;
    },

    async setActiveGroupProject(project: any) {
      if (!project) return;

      this.activeGroupProject = project;

      try {
        await UserProjectGroup.setProjectWorkspace({
          group_project: project.id,
        });
      } catch (error) {
        console.error("Erro ao definir o grupo de projeto ativo:", error);
      }
    },

    async loadInitialData(preferences: any, newGroupProjects: any) {
      await this.setProjects(newGroupProjects);

      if (
        this.activeGroupProject &&
        this.activeGroupProject.id === preferences.selected_group_project
      ) {
        return;
      }

      const favoriteProject = newGroupProjects.find(
        (project: any) => project.id === preferences.selected_group_project
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
