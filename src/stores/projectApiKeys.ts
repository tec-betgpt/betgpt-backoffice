import { defineStore } from "pinia";
import projectApiKeysService, {
  normalizeProjectApiKeyError,
} from "@/services/projectApiKeys";
import type {
  IssuedProjectApiKeyResponse,
  IssueProjectApiKeyRequest,
  ProjectApiKey,
  ProjectApiKeyError,
  ProjectApiKeyRotationPolicy,
  ProjectApiKeyStatus,
  RotatedProjectApiKeyResponse,
  UpdateProjectApiKeyRequest,
} from "@/contracts/projectApiKeys";

export type ProjectApiKeyStatusFilter = ProjectApiKeyStatus | "all";

export const MANAGE_PROJECT_API_KEYS_PERMISSION = "manage-project-api-keys";

/**
 * Secret recém-criado/rotacionado mantido apenas em memória volátil, durante
 * o fluxo de exibição única. Nunca vai para storage persistido e deve ser
 * descartado via `clearEphemeralSecret()` ao fechar o modal, trocar de rota,
 * trocar de projeto ou concluir cópia/download.
 */
export interface EphemeralProjectApiSecret {
  kind: "created" | "rotated";
  apiKey: ProjectApiKey;
  secret: string;
  rotationPolicy: ProjectApiKeyRotationPolicy | null;
  previousSecretValidUntil: string | null;
}

export const useProjectApiKeysStore = defineStore("projectApiKeys", {
  state: () => ({
    /** Id numérico do projeto ativo (rota `projects/:id/api-keys`). */
    activeProjectId: null as number | null,
    /** Lista isolada por projeto — nunca reutilizada entre projetos. */
    keysByProject: {} as Record<number, ProjectApiKey[]>,
    loading: false,
    error: null as ProjectApiKeyError | null,
    statusFilter: "all" as ProjectApiKeyStatusFilter,
    ephemeralSecret: null as EphemeralProjectApiSecret | null,
  }),

  getters: {
    /** Lista do projeto ativo; vazia quando não carregada ou sem projeto. */
    keys(state): ProjectApiKey[] {
      if (state.activeProjectId == null) return [];
      return state.keysByProject[state.activeProjectId] ?? [];
    },

    filteredKeys(): ProjectApiKey[] {
      if (this.statusFilter === "all") return this.keys;
      return this.keys.filter((key) => key.status === this.statusFilter);
    },

    isForbidden(state): boolean {
      return state.error?.status === 403;
    },
  },

  actions: {
    /**
     * Sincroniza o store com o projeto da rota. Trocar de projeto descarta o
     * secret efêmero e força refetch — a lista de um projeto nunca é exibida
     * em outro.
     */
    async syncProject(projectId: number | null | undefined) {
      const id = projectId != null && Number.isFinite(projectId) ? Number(projectId) : null;

      if (id === this.activeProjectId) return;

      this.activeProjectId = id;
      this.error = null;
      this.clearEphemeralSecret();

      if (id != null) {
        await this.fetchKeys();
      }
    },

    async fetchKeys() {
      if (this.activeProjectId == null) return;

      this.loading = true;
      this.error = null;

      try {
        const keys = await projectApiKeysService.listProjectApiKeys(
          this.activeProjectId,
        );
        this.keysByProject = {
          ...this.keysByProject,
          [this.activeProjectId]: keys,
        };
      } catch (error) {
        // Em erro (ex.: 403), não manter dados residuais do projeto.
        this.keysByProject = {
          ...this.keysByProject,
          [this.activeProjectId]: [],
        };
        this.error = normalizeProjectApiKeyError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setStatusFilter(filter: ProjectApiKeyStatusFilter) {
      this.statusFilter = filter;
    },

    /** Cria e guarda o secret em estado volátil para exibição única. */
    async createKey(
      payload: IssueProjectApiKeyRequest,
    ): Promise<IssuedProjectApiKeyResponse> {
      this.assertActiveProject();
      const result = await projectApiKeysService.createProjectApiKey(
        this.activeProjectId as number,
        payload,
      );

      this.upsertKey(result.api_key);
      this.ephemeralSecret = {
        kind: "created",
        apiKey: result.api_key,
        secret: result.secret,
        rotationPolicy: null,
        previousSecretValidUntil: null,
      };

      return result;
    },

    async updateKey(
      uuid: string,
      payload: UpdateProjectApiKeyRequest,
    ): Promise<ProjectApiKey> {
      this.assertActiveProject();

      try {
        const updated = await projectApiKeysService.updateProjectApiKey(
          this.activeProjectId as number,
          uuid,
          payload,
        );
        this.upsertKey(updated);
        return updated;
      } catch (error) {
        await this.handleStateConflict(error);
        throw error;
      }
    },

    /** Rotaciona e guarda o novo secret + política de rotação em estado volátil. */
    async rotateKey(uuid: string): Promise<RotatedProjectApiKeyResponse> {
      this.assertActiveProject();

      try {
        const result = await projectApiKeysService.rotateProjectApiKey(
          this.activeProjectId as number,
          uuid,
        );
        this.upsertKey(result.api_key);
        this.ephemeralSecret = {
          kind: "rotated",
          apiKey: result.api_key,
          secret: result.secret,
          rotationPolicy: result.rotation_policy,
          previousSecretValidUntil: result.previous_secret_valid_until,
        };
        return result;
      } catch (error) {
        await this.handleStateConflict(error);
        throw error;
      }
    },

    /** Revoga (sem optimistic update) e reflete o status `revoked` confirmado. */
    async revokeKey(uuid: string): Promise<ProjectApiKey | null> {
      this.assertActiveProject();

      try {
        const revoked = await projectApiKeysService.revokeProjectApiKey(
          this.activeProjectId as number,
          uuid,
        );

        if (revoked) {
          this.upsertKey(revoked);
        } else {
          // Backend não devolveu a chave: recarrega o estado oficial.
          await this.fetchKeys();
        }

        return revoked;
      } catch (error) {
        await this.handleStateConflict(error);
        throw error;
      }
    },

    /**
     * Em 409 `state_conflict` (outro operador alterou a chave), recarrega o
     * estado oficial antes de propagar o erro para a UI.
     */
    async handleStateConflict(error: unknown) {
      if (normalizeProjectApiKeyError(error).code === "state_conflict") {
        await this.fetchKeys().catch(() => undefined);
      }
    },

    /** Descarta o secret efêmero (fechar modal, trocar rota/projeto, pós-cópia). */
    clearEphemeralSecret() {
      this.ephemeralSecret = null;
    },

    upsertKey(apiKey: ProjectApiKey) {
      if (this.activeProjectId == null) return;

      const current = this.keysByProject[this.activeProjectId] ?? [];
      const index = current.findIndex((key) => key.uuid === apiKey.uuid);
      const next =
        index >= 0
          ? current.map((key) => (key.uuid === apiKey.uuid ? apiKey : key))
          : [...current, apiKey];

      this.keysByProject = {
        ...this.keysByProject,
        [this.activeProjectId]: next,
      };
    },

    assertActiveProject() {
      if (this.activeProjectId == null) {
        throw new Error(
          "Nenhum projeto selecionado para administrar API keys.",
        );
      }
    },

    /** Limpeza integral no logout: listas, erros e valores efêmeros. */
    reset() {
      this.activeProjectId = null;
      this.keysByProject = {};
      this.loading = false;
      this.error = null;
      this.statusFilter = "all";
      this.ephemeralSecret = null;
    },
  },
});
