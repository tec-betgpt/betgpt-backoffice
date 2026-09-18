import { ref } from "vue";
import Projects from "@/services/projects";
import type { Project } from "@/contracts/project";

/**
 * Lista de projetos disponíveis para compor/selecionar grupos.
 *
 * Fonte: `GET /projects` (envelope SPA, `data` é o array). O usuário de
 * `/auth/user` NÃO traz `projects`/`ownerProjects`, então não use a store de
 * auth como fonte — foi a causa de a lista vir vazia.
 */
export function useAvailableProjects() {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProjects(): Promise<Project[]> {
    loading.value = true;
    error.value = null;
    try {
      const response = await Projects.index();
      projects.value = Array.isArray(response?.data) ? response.data : [];
    } catch (err) {
      projects.value = [];
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
    return projects.value;
  }

  return { projects, loading, error, fetchProjects };
}
