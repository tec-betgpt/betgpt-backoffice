import { buildMcpServerUrl } from "@/lib/mcp";
import type { McpConnection, McpOverview } from "@/contracts/mcp";

/**
 * Serviço de MCP — camada mockada.
 *
 * A API de MCP ainda não existe. Este módulo devolve dados de exemplo no
 * mesmo formato que o backend deverá entregar (`McpOverview`). Quando os
 * endpoints estiverem prontos, basta trocar a implementação das funções
 * abaixo por chamadas a `api` sem alterar a store nem a tela.
 */

const MOCK_LATENCY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function daysAgo(days: number, hours = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function buildSampleConnections(): McpConnection[] {
  return [
    {
      id: "conn_claude_desktop",
      assistant: "Claude",
      client: "Claude Desktop · macOS",
      connectedAt: daysAgo(9),
      lastActivityAt: daysAgo(0, 2),
    },
    {
      id: "conn_chatgpt_web",
      assistant: "ChatGPT",
      client: "ChatGPT · Web",
      connectedAt: daysAgo(4),
      lastActivityAt: daysAgo(1, 5),
    },
    {
      id: "conn_cursor",
      assistant: "Outro",
      client: "Cursor · Linux",
      connectedAt: daysAgo(21),
      lastActivityAt: daysAgo(6),
    },
  ];
}

export interface FetchMcpOverviewParams {
  groupId: number;
  groupName: string | null | undefined;
}

export async function fetchMcpOverview(
  params: FetchMcpOverviewParams,
): Promise<McpOverview> {
  await delay(MOCK_LATENCY_MS);

  const connections = buildSampleConnections();

  return {
    groupId: params.groupId,
    groupName: params.groupName?.trim() || `Grupo ${params.groupId}`,
    serverUrl: buildMcpServerUrl(),
    serverActive: true,
    stats: {
      activeConnections: connections.length,
      callsLast7Days: 1284,
      failuresLast7Days: 7,
    },
    connections,
  };
}

/**
 * Revoga o acesso de um assistente ao grupo. No mock apenas aguarda a
 * latência e confirma; a remoção da lista é feita pela store.
 */
export async function revokeMcpConnection(
  _groupId: number,
  _connectionId: string,
): Promise<void> {
  await delay(MOCK_LATENCY_MS);
}
