import api from "./base";

export type McpAuditStatus = "success" | "error";

export interface McpAuditEntry {
  id: number;
  tool: string;
  status: McpAuditStatus;
  duration_ms: number;
  client: string | null;
  filter_id: string | null;
  error: string | null;
  occurred_at: string | null;
}

/**
 * Trilha de auditoria de uso do MCP do usuário autenticado.
 * A gravação é feita pelo servidor MCP; aqui apenas consultamos.
 */
export default {
  async list(): Promise<McpAuditEntry[]> {
    const { data } = await api.get("/mcp/audit");

    return data?.data?.items ?? [];
  },
};
