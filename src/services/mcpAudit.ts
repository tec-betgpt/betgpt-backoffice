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

export interface McpAuditStats {
  calls_last_7_days: number;
  failures_last_7_days: number;
}

export interface McpAuditResult {
  items: McpAuditEntry[];
  stats: McpAuditStats;
}

const EMPTY_STATS: McpAuditStats = {
  calls_last_7_days: 0,
  failures_last_7_days: 0,
};

/**
 * Trilha de auditoria de uso do MCP do usuário autenticado.
 * A gravação é feita pelo servidor MCP; aqui apenas consultamos.
 */
export default {
  async list(): Promise<McpAuditResult> {
    const { data } = await api.get("/mcp/audit");
    const payload = data?.data ?? {};

    return {
      items: payload.items ?? [],
      stats: payload.stats ?? EMPTY_STATS,
    };
  },
};
