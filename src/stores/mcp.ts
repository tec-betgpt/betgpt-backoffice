import { defineStore } from "pinia";
import {
  fetchMcpOverview,
  revokeMcpConnection,
} from "@/services/mcp";
import type { McpOverview } from "@/contracts/mcp";

/**
 * Estado da tela de MCP.
 *
 * Guarda o overview por grupo para que trocar de workspace não misture
 * dados. Como o serviço é mockado, tudo é carregado na hora; quando a API
 * existir, os mesmos pontos de entrada continuam válidos.
 */
export const useMcpStore = defineStore("mcp", {
  state: () => ({
    /** `group_{id}` convertido para número; null quando o workspace é um projeto. */
    groupId: null as number | null,
    groupName: null as string | null,
    overview: null as McpOverview | null,
    loading: false,
    error: null as string | null,
    /** Conexão em processo de revogação (desabilita o botão correspondente). */
    revokingId: null as string | null,
    /** Guarda contra respostas fora de ordem ao trocar de grupo. */
    requestSeq: 0,
  }),

  getters: {
    hasGroup: (state): boolean => state.groupId !== null,
    connections: (state) => state.overview?.connections ?? [],
    stats: (state) => state.overview?.stats ?? null,
    isRevoking: (state): boolean => state.revokingId !== null,
  },

  actions: {
    /**
     * Sincroniza a tela com o workspace ativo. Projetos (sem grupo) não
     * têm servidor MCP, então o estado fica vazio.
     */
    async syncWorkspace(groupId: number | null, groupName: string | null) {
      if (groupId === this.groupId && this.overview) return;

      this.groupId = groupId;
      this.groupName = groupName;
      this.overview = null;
      this.error = null;

      if (groupId === null) return;

      await this.fetchOverview();
    },

    async fetchOverview() {
      if (this.groupId === null) return;

      this.loading = true;
      this.error = null;
      const seq = ++this.requestSeq;

      try {
        const overview = await fetchMcpOverview({
          groupId: this.groupId,
          groupName: this.groupName,
        });

        // Grupo trocado durante a requisição: descarta a resposta antiga.
        if (seq !== this.requestSeq) return;

        this.overview = overview;
      } catch (err) {
        if (seq !== this.requestSeq) return;
        this.error = err instanceof Error ? err.message : String(err);
      } finally {
        if (seq === this.requestSeq) this.loading = false;
      }
    },

    async revoke(connectionId: string) {
      if (this.groupId === null || this.revokingId !== null) return;

      const groupId = this.groupId;
      this.revokingId = connectionId;

      try {
        await revokeMcpConnection(groupId, connectionId);
        if (this.groupId === groupId) this.removeConnection(connectionId);
      } finally {
        this.revokingId = null;
      }
    },

    removeConnection(connectionId: string) {
      if (!this.overview) return;

      const connections = this.overview.connections.filter(
        (connection) => connection.id !== connectionId,
      );

      this.overview.connections = connections;
      this.overview.stats.activeConnections = connections.length;
    },
  },
});
