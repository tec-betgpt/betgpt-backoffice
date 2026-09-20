import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/services/base";
import {
  listGroups,
  createGroup,
  updateMember,
  transferGroup,
  acceptInvitation,
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

  it("acceptInvitation POSTs the uuid accept route without a body", async () => {
    mocked.post.mockResolvedValue({ data: {} });
    await acceptInvitation("abc-123");
    expect(mocked.post).toHaveBeenCalledWith(
      "/groups/invitations/abc-123/accept",
    );
  });
});
