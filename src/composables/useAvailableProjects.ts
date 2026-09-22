import { computed, type ComputedRef } from "vue";
import { useAuthStore } from "@/stores/auth";
import type { WorkspaceGroupProject } from "@/contracts/workspace";

export interface AvailableProject {
  id: number;
  name: string;
  logo: string | null;
}

function resolveProjectId(item: WorkspaceGroupProject): number {
  if (typeof item.project_id === "number") return item.project_id;
  return Number(String(item.id).replace(/^project_/, ""));
}

/**
 * Projetos disponíveis para compor/selecionar grupos.
 *
 * Fonte: `GET /auth/user` → `data.group_projects`, filtrando `type === "project"`.
 * A rota `/projects` NÃO deve ser usada aqui (o backend já entrega no usuário a
 * lista de projetos acessíveis, com `project_id`).
 */
export function useAvailableProjects(): {
  projects: ComputedRef<AvailableProject[]>;
} {
  const authStore = useAuthStore();

  const projects = computed<AvailableProject[]>(() => {
    const items = ((authStore.user as any)?.group_projects ??
      []) as WorkspaceGroupProject[];

    return items
      .filter((item) => item.type === "project")
      .map((item) => ({
        id: resolveProjectId(item),
        name: item.name,
        logo: item.logo,
      }))
      .filter((project) => Number.isFinite(project.id));
  });

  return { projects };
}
