import api from "./base";

/**
 * Handoff SSO do backoffice para o servidor MCP.
 *
 * O código é de uso único (60s) e só pode ser trocado pelo servidor MCP,
 * com o segredo interno. O token da API nunca vai para a URL.
 */
export default {
  async handoff(payload: { redirect_uri: string; state: string }) {
    const { data } = await api.post("/auth/mcp/handoff", payload);

    return data?.data ?? data;
  },
};
