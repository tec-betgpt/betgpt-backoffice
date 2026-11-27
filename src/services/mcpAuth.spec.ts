import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./base", () => ({
  default: { post: vi.fn() },
}));

import api from "./base";
import McpAuth from "./mcpAuth";

describe("mcpAuth.handoff", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("envia redirect_uri e state e devolve o código desembrulhado", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, message: null, data: { code: "abc", expires_in: 60 } },
    } as never);

    const result = await McpAuth.handoff({
      redirect_uri: "https://mcp.test/auth/handoff/callback",
      state: "state-1",
    });

    expect(api.post).toHaveBeenCalledWith("/auth/mcp/handoff", {
      redirect_uri: "https://mcp.test/auth/handoff/callback",
      state: "state-1",
    });
    expect(result).toEqual({ code: "abc", expires_in: 60 });
  });
});
