import { defineStore } from "pinia";
import marketingApiKeysService, {
  normalizeMarketingApiKeyError,
  resolveGroupIdFromWorkspaceKey,
} from "@/services/marketingApiKeys";
import { useAuthStore } from "@/stores/auth";
import type {
  CreateMarketingApiKeyPayload,
  MarketingApiKey,
  MarketingApiKeyError,
  MarketingApiKeyIssued,
  MarketingApiKeyRotated,
  MarketingApiKeyRotationPolicy,
  MarketingApiKeyStatus,
  UpdateMarketingApiKeyPayload,
} from "@/contracts/marketingApiKeys";

export type MarketingApiKeyStatusFilter = MarketingApiKeyStatus | "all";

export const MANAGE_MARKETING_API_KEYS_PERMISSION = "manage-marketing-api-keys";

/**
 * Secret recém-criado/rotacionado mantido apenas em memória volátil, durante
 * o fluxo de exibição única. Nunca vai para storage persistido e deve ser
 * descartado via `clearEphemeralSecret()` ao fechar o modal, trocar de rota,
 * trocar de workspace ou concluir cópia/download.
 */
export interface EphemeralMarketingApiSecret {
  kind: "created" | "rotated";
  apiKey: MarketingApiKey;
  secret: string;
  rotationPolicy: MarketingApiKeyRotationPolicy | null;
  previousSecretValidUntil: string | null;
}

export const useMarketingApiKeysStore = defineStore("marketingApiKeys", {
  state: () => ({
    /** Id numérico do grupo ativo (`group_{id}` da preferência selecionada). */
    activeGroupId: null as number | null,
    /** Lista isolada por workspace — nunca reutilizada entre grupos. */
    keysByGroup: {} as Record<number, MarketingApiKey[]>,
    loading: false,
    error: null as MarketingApiKeyError | null,
    statusFilter: "all" as MarketingApiKeyStatusFilter,
    ephemeralSecret: null as EphemeralMarketingApiSecret | null,
  }),

  getters: {
    /** Lista do workspace ativo; vazia quando não carregada ou sem grupo. */
    keys(state): MarketingApiKey[] {
      if (state.activeGroupId == null) return [];
      return state.keysByGroup[state.activeGroupId] ?? [];
    },

    filteredKeys(): MarketingApiKey[] {
      if (this.statusFilter === "all") return this.keys;
      return this.keys.filter((key) => key.status === this.statusFilter);
    },

    isForbidden(state): boolean {
      return state.error?.status === 403;
    },

    /**
     * Capability administrativa por grupo: dono do grupo
     * (`group.user_id === user.id`) ou permissão `manage-marketing-api-keys`.
     * Projeto isolado do grupo (groupId null) NÃO concede administração.
     */
    canManageGroup(): (groupId: number | null) => boolean {
      const authStore = useAuthStore();
      // auth store é legada em JS; `user` chega sem tipagem estática.
      const user = authStore.user as any;

      return (groupId: number | null) => {
        if (!user || groupId == null) return false;

        const ownsGroup = user.projectGroups?.some(
          (group: { id: number; user_id: number }) =>
            group.id === groupId && group.user_id === user.id,
        );
        if (ownsGroup) return true;

        return Boolean(
          user.roles?.some((role: any) =>
            role.permissions?.some(
              (permission: any) =>
                permission.name === MANAGE_MARKETING_API_KEYS_PERMISSION,
            ),
          ),
        );
      };
    },

    /** Capability para o workspace ativo no store. */
    canManage(): boolean {
      return this.canManageGroup(this.activeGroupId);
    },
  },

  actions: {
    /**
     * Sincroniza o store com o workspace selecionado. Trocar de workspace
     * descarta o secret efêmero e força refetch — a lista de um grupo nunca
     * é exibida em outro.
     */
    async syncWorkspace(workspaceKey: string | null | undefined) {
      const groupId = resolveGroupIdFromWorkspaceKey(workspaceKey);

      if (groupId === this.activeGroupId) return;

      this.activeGroupId = groupId;
      this.error = null;
      this.clearEphemeralSecret();

      if (groupId != null) {
        await this.fetchApiKeys();
      }
    },

    async fetchApiKeys() {
      if (this.activeGroupId == null) return;

      this.loading = true;
      this.error = null;

      try {
        const keys = await marketingApiKeysService.listApiKeys(
          this.activeGroupId,
        );
        this.keysByGroup = { ...this.keysByGroup, [this.activeGroupId]: keys };
      } catch (error) {
        // Em erro (ex.: 403), não manter dados residuais do workspace.
        this.keysByGroup = { ...this.keysByGroup, [this.activeGroupId]: [] };
        this.error = normalizeMarketingApiKeyError(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setStatusFilter(filter: MarketingApiKeyStatusFilter) {
      this.statusFilter = filter;
    },

    /** Cria e guarda o secret em estado volátil para exibição única. */
    async createApiKey(
      payload: CreateMarketingApiKeyPayload,
    ): Promise<MarketingApiKeyIssued> {
      this.assertActiveGroup();
      const result = await marketingApiKeysService.createApiKey(
        this.activeGroupId as number,
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

    async updateApiKey(
      uuid: string,
      payload: UpdateMarketingApiKeyPayload,
    ): Promise<MarketingApiKey> {
      this.assertActiveGroup();

      try {
        const updated = await marketingApiKeysService.updateApiKey(
          this.activeGroupId as number,
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
    async rotateApiKey(uuid: string): Promise<MarketingApiKeyRotated> {
      this.assertActiveGroup();

      try {
        const result = await marketingApiKeysService.rotateApiKey(
          this.activeGroupId as number,
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
    async revokeApiKey(uuid: string): Promise<MarketingApiKey | null> {
      this.assertActiveGroup();

      try {
        const revoked = await marketingApiKeysService.revokeApiKey(
          this.activeGroupId as number,
          uuid,
        );

        if (revoked) {
          this.upsertKey(revoked);
        } else {
          // Backend não devolveu a chave: recarrega o estado oficial.
          await this.fetchApiKeys();
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
      if (normalizeMarketingApiKeyError(error).code === "state_conflict") {
        await this.fetchApiKeys().catch(() => undefined);
      }
    },

    /** Descarta o secret efêmero (fechar modal, trocar rota/workspace, pós-cópia). */
    clearEphemeralSecret() {
      this.ephemeralSecret = null;
    },

    upsertKey(apiKey: MarketingApiKey) {
      if (this.activeGroupId == null) return;

      const current = this.keysByGroup[this.activeGroupId] ?? [];
      const index = current.findIndex((key) => key.uuid === apiKey.uuid);
      const next =
        index >= 0
          ? current.map((key) => (key.uuid === apiKey.uuid ? apiKey : key))
          : [...current, apiKey];

      this.keysByGroup = { ...this.keysByGroup, [this.activeGroupId]: next };
    },

    assertActiveGroup() {
      if (this.activeGroupId == null) {
        throw new Error(
          "Nenhum workspace de grupo selecionado para administrar API keys.",
        );
      }
    },

    /** Limpeza integral no logout: listas, erros e valores efêmeros. */
    reset() {
      this.activeGroupId = null;
      this.keysByGroup = {};
      this.loading = false;
      this.error = null;
      this.statusFilter = "all";
      this.ephemeralSecret = null;
    },
  },
});
