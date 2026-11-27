import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./base", () => ({
  default: { get: vi.fn() },
}));

import api from "./base";
import McpAuditService from "./mcpAudit";

describe("mcpAudit.list", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("consulta /mcp/audit e devolve itens e métricas", async () => {
    const items = [
      {
        id: 1,
        tool: "PlayersList",
        status: "success",
        duration_ms: 42,
        client: "Claude",
        filter_id: "group_1",
        error: null,
        occurred_at: "2026-11-26T12:00:00+00:00",
      },
    ];
    const stats = { calls_last_7_days: 12, failures_last_7_days: 2 };

    vi.mocked(api.get).mockResolvedValue({
      data: { success: true, data: { items, stats } },
    } as never);

    await expect(McpAuditService.list()).resolves.toEqual({ items, stats });
    expect(api.get).toHaveBeenCalledWith("/mcp/audit");
  });

  it("usa valores neutros quando a API não envia dados", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: {} } } as never);

    await expect(McpAuditService.list()).resolves.toEqual({
      items: [],
      stats: { calls_last_7_days: 0, failures_last_7_days: 0 },
    });
  });
});
