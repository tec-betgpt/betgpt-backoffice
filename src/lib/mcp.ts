/**
 * Endereço público do servidor MCP do Elevate.
 *
 * O endpoint é único para todos os usuários/grupos; a autenticação é feita
 * por OAuth 2.1 (login SSO no backoffice) e a escolha de grupo/projeto
 * acontece nos argumentos das ferramentas (`filter_id`).
 */
const configuredUrl = String(
  import.meta.env.VITE_MCP_URL ?? "https://mcp.myelevate.ai",
).replace(/\/+$/, "");

export const MCP_BASE_URL = configuredUrl;

export function buildMcpServerUrl(): string {
  return `${MCP_BASE_URL}/mcp`;
}
