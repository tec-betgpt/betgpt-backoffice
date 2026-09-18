import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useAvailableProjects } from "@/composables/useAvailableProjects";

describe("useAvailableProjects", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("derives selectable projects from user.group_projects (type=project)", () => {
    const authStore = useAuthStore();
    authStore.user = {
      group_projects: [
        { id: "group_21", label: "[Grupo] Elevate", name: "Elevate", type: "group", is_selected: false, logo: null },
        { id: "project_38", label: "[Projeto] Ale Dantas", name: "Ale Dantas", type: "project", is_selected: false, logo: "logo.png", project_id: 38 },
        { id: "project_12", label: "[Projeto] BR4BET", name: "BR4BET", type: "project", is_selected: true, logo: null, project_id: 12 },
      ],
    } as any;

    const { projects } = useAvailableProjects();

    expect(projects.value).toEqual([
      { id: 38, name: "Ale Dantas", logo: "logo.png" },
      { id: 12, name: "BR4BET", logo: null },
    ]);
  });

  it("falls back to the id suffix when project_id is missing", () => {
    const authStore = useAuthStore();
    authStore.user = {
      group_projects: [
        { id: "project_7", label: "[Projeto] Lotogreen", name: "Lotogreen", type: "project", is_selected: false, logo: null },
      ],
    } as any;

    const { projects } = useAvailableProjects();

    expect(projects.value).toEqual([{ id: 7, name: "Lotogreen", logo: null }]);
  });

  it("returns an empty list when the user is not loaded", () => {
    const authStore = useAuthStore();
    authStore.user = null as any;

    const { projects } = useAvailableProjects();

    expect(projects.value).toEqual([]);
  });
});
