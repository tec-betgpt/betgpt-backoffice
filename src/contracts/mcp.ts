/**
 * Contratos da tela de MCP (Configurações → MCP).
 *
 * A API ainda não existe; estes tipos descrevem o formato que o backend
 * deverá devolver para que a UI continue funcionando sem alterações.
 */

export interface McpUsageStats {
  /** Assistentes conectados com acesso ativo ao grupo. */
  activeConnections: number;
  /** Chamadas de ferramentas nos últimos 7 dias. */
  callsLast7Days: number;
  /** Chamadas que falharam nos últimos 7 dias. */
  failuresLast7Days: number;
}

export interface McpConnection {
  id: string;
  /** Assistente que abriu a conexão (ex.: "Claude"). */
  assistant: string;
  /** Cliente/origem da conexão (ex.: "Claude Desktop · macOS"). */
  client: string;
  /** ISO 8601. */
  connectedAt: string;
  /** ISO 8601. */
  lastActivityAt: string;
}

export interface McpOverview {
  groupId: number;
  groupName: string;
  serverUrl: string;
  serverActive: boolean;
  stats: McpUsageStats;
  connections: McpConnection[];
}
