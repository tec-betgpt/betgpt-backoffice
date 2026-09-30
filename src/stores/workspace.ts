import { defineStore } from "pinia";
import UserProjectGroup from "@/services/userProjectGroup";
import { filterIdToGroupId, filterIdToProjectId } from "@/lib/filterId";
import type { WorkspaceFilterItem } from "@/contracts/userProjectGroup";
import type { DateRange } from "reka-ui";

export const useWorkspaceStore = defineStore("workspace", {
  state: () => ({
    activeGroupProject: null as WorkspaceFilterItem | null,
    group_projects: [] as WorkspaceFilterItem[],
    lastAnnotationUpdate: null as number | null,
    date:null as DateRange|null,
    context: null as Array<string> | null,
  }),
  getters: {
    filterId: (state): string | null => state.activeGroupProject?.id ?? null,
    numericProjectId: (state): number | null => {
      const value = Number(state.activeGroupProject?.project_id);
      if (Number.isInteger(value) && value > 0) {
        return value;
      }
      return filterIdToProjectId(state.activeGroupProject?.id);
    },
    numericGroupId: (state): number | null =>
      filterIdToGroupId(state.activeGroupProject?.id),
    isGroupWorkspace: (state): boolean =>
      state.activeGroupProject?.type === "group",
    hasActiveWorkspace: (state): boolean =>
      Boolean(state.activeGroupProject?.id),
  },
  actions: {
    notifyAnnotationUpdate() {
      this.lastAnnotationUpdate = Date.now();
    },

    async setProjects(newGroupProjects: WorkspaceFilterItem[]) {
      this.group_projects = newGroupProjects;
    },

    async setActiveGroupProject(project: WorkspaceFilterItem) {
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

    async loadInitialData(preferences: any, newGroupProjects: WorkspaceFilterItem[] = []) {
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

    async setDate(date: DateRange) {
      this.date = date;
    },

    async setContext(context: Array<string>) {
      this.context = context
    }
  },
});
