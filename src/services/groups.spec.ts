import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import {
  listGroups,
  createGroup,
  updateMember,
  transferGroup,
  acceptInvitation,
  getGroupHome,
  getGroupFinancialDashboard,
  listGroupConsolidated,
  createGroupFinancialTransaction,
  deleteGroupFinancialTransaction,
  unwrap,
} from "@/services/groups";

vi.mock("@/services/base", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mocked = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("groups service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getGroupHome GETs /groups/{group}/home and unwraps", async () => {
    mocked.get.mockResolvedValue({
      data: { success: true, data: { players: { count: 1 } } },
    });
    await expect(
      getGroupHome(10, { start_date: "2026-09-01", end_date: "2026-09-10" }),
    ).resolves.toEqual({ players: { count: 1 } });
    expect(mocked.get).toHaveBeenCalledWith("/groups/10/home", {
      params: { start_date: "2026-09-01", end_date: "2026-09-10" },
    });
  });

  it("getGroupFinancialDashboard GETs the group dashboard route", async () => {
    mocked.get.mockResolvedValue({ data: { success: true, data: { period: {} } } });
    await getGroupFinancialDashboard(10, { start_date: "a", end_date: "b" });
    expect(mocked.get).toHaveBeenCalledWith(
      "/groups/10/financial-transactions/dashboard",
      { params: { start_date: "a", end_date: "b" } },
    );
  });

  it("listGroupConsolidated GETs /groups/{group}/{resource}", async () => {
    mocked.get.mockResolvedValue({ data: { success: true, data: { data: [] } } });
    await listGroupConsolidated(10, "players", { page: 2 });
    expect(mocked.get).toHaveBeenCalledWith("/groups/10/players", {
      params: { page: 2 },
    });
  });

  it("createGroupFinancialTransaction POSTs without project/cost/sector", async () => {
    mocked.post.mockResolvedValue({
      data: { success: true, data: { id: 1 } },
    });
    await createGroupFinancialTransaction(10, {
      type: "revenue",
      category_type: "receita_grupo",
      amount: 500,
      date: "2026-09-10",
      description: "Receita consolidada",
    });
    expect(mocked.post).toHaveBeenCalledWith(
      "/groups/10/financial-transactions",
      {
        type: "revenue",
        category_type: "receita_grupo",
        amount: 500,
        date: "2026-09-10",
        description: "Receita consolidada",
      },
    );
  });

  it("deleteGroupFinancialTransaction DELETEs the transaction route", async () => {
    mocked.delete.mockResolvedValue({ data: {} });
    await deleteGroupFinancialTransaction(10, 7);
    expect(mocked.delete).toHaveBeenCalledWith(
      "/groups/10/financial-transactions/7",
    );
  });

  it("unwrap extracts data from the SPA envelope", () => {
    expect(unwrap({ success: true, data: [1, 2] })).toEqual([1, 2]);
  });

  it("unwrap returns the payload when it is not enveloped", () => {
    expect(unwrap([1, 2] as unknown as any)).toEqual([1, 2]);
  });

  it("listGroups GETs /groups and returns data", async () => {
    mocked.get.mockResolvedValue({ data: { success: true, data: [{ id: 1 }] } });
    await expect(listGroups()).resolves.toEqual([{ id: 1 }]);
    expect(mocked.get).toHaveBeenCalledWith("/groups");
  });

  it("createGroup POSTs /groups with the payload", async () => {
    mocked.post.mockResolvedValue({
      data: { success: true, data: { id: 10 } },
    });
    await createGroup({ name: "Empresa X", project_ids: [1, 2] });
    expect(mocked.post).toHaveBeenCalledWith("/groups", {
      name: "Empresa X",
      project_ids: [1, 2],
    });
  });

  it("updateMember PATCHes /groups/{group}/members/{user}", async () => {
    mocked.patch.mockResolvedValue({
      data: { success: true, data: { user_id: 6, role: "editor" } },
    });
    await updateMember(10, 6, { role: "editor", access_projects: true });
    expect(mocked.patch).toHaveBeenCalledWith("/groups/10/members/6", {
      role: "editor",
      access_projects: true,
    });
  });

  it("transferGroup POSTs /groups/{group}/transfer with user_id", async () => {
    mocked.post.mockResolvedValue({
      data: { success: true, data: { id: 10, owner_user_id: 6 } },
    });
    await transferGroup(10, 6);
    expect(mocked.post).toHaveBeenCalledWith("/groups/10/transfer", {
      user_id: 6,
    });
  });

  it("acceptInvitation POSTs the uuid accept route with the token", async () => {
    mocked.post.mockResolvedValue({ data: {} });
    await acceptInvitation("abc-123", "token-xyz");
    expect(mocked.post).toHaveBeenCalledWith(
      "/groups/invitations/abc-123/accept",
      { token: "token-xyz" },
    );
  });
});
