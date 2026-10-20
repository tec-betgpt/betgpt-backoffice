import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import groupsService from "@/services/groups";
import { useGroupsStore } from "@/stores/groups";

vi.mock("@/services/groups", () => ({
  default: {
    listGroups: vi.fn(),
    createGroup: vi.fn(),
    getGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    replaceGroupProjects: vi.fn(),
    listMembers: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    createInvitation: vi.fn(),
    listInvitations: vi.fn(),
    revokeInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    declineInvitation: vi.fn(),
    listMyInvitations: vi.fn(),
  },
}));

const mocked = groupsService as unknown as Record<
  string,
  ReturnType<typeof vi.fn>
>;

describe("groups store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("fetchGroups populates the list", async () => {
    mocked.listGroups.mockResolvedValue([{ id: 1, name: "Empresa X" }]);
    const store = useGroupsStore();
    await store.fetchGroups();
    expect(store.groups).toEqual([{ id: 1, name: "Empresa X" }]);
    expect(store.loading).toBe(false);
  });

  it("fetchGroups records a normalized error and rethrows", async () => {
    mocked.listGroups.mockRejectedValue(new Error("network down"));
    const store = useGroupsStore();
    await expect(store.fetchGroups()).rejects.toThrow("network down");
    expect(store.error?.message).toBe("network down");
    expect(store.loading).toBe(false);
  });

  it("deleteGroup removes it from the local list", async () => {
    mocked.deleteGroup.mockResolvedValue(undefined);
    const store = useGroupsStore();
    store.groups = [{ id: 1 }, { id: 2 }] as any;
    await store.deleteGroup(1);
    expect(store.groups.map((g) => g.id)).toEqual([2]);
  });

  it("acceptInvitation removes the invitation from myInvitations", async () => {
    mocked.acceptInvitation.mockResolvedValue(undefined);
    const store = useGroupsStore();
    store.myInvitations = [{ id: 21, uuid: "abc" }] as any;
    await store.acceptInvitation("abc", "token-123");
    expect(store.myInvitations).toEqual([]);
  });
});
