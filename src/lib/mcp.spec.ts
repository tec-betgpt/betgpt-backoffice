import { describe, expect, it } from "vitest";
import { MCP_BASE_URL, buildMcpServerUrl } from "@/lib/mcp";

describe("buildMcpServerUrl", () => {
  it("aponta para o endpoint único /mcp", () => {
    expect(buildMcpServerUrl()).toBe(`${MCP_BASE_URL}/mcp`);
  });
});
