import { describe, expect, it } from "vitest";
import { resolveGroupPermissions } from "@/composables/useGroupPermissions";

const owner = { user_id: 5, role: "owner" as const };
const admin = { user_id: 6, role: "admin" as const };
const editor = { user_id: 7, role: "editor" as const };
const viewer = { user_id: 8, role: "viewer" as const };

function groupFor(ownerUserId: number, members: any[]) {
  return { owner_user_id: ownerUserId, members };
}

describe("resolveGroupPermissions", () => {
  it("returns no permissions when user has no membership", () => {
    const permissions = resolveGroupPermissions(groupFor(5, [owner]), 99);
    expect(permissions.role).toBeNull();
    expect(permissions.canView).toBe(false);
    expect(permissions.canDelete).toBe(false);
  });

  it("owner can do everything", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner]), 5);
    expect(p.role).toBe("owner");
    expect(p.isOwner).toBe(true);
    expect(p.canEdit).toBe(true);
    expect(p.canManageProjects).toBe(true);
    expect(p.canManageMembers).toBe(true);
    expect(p.canManageInvitations).toBe(true);
    expect(p.canDelete).toBe(true);
  });

  it("admin manages but cannot delete", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, admin]), 6);
    expect(p.role).toBe("admin");
    expect(p.canEdit).toBe(true);
    expect(p.canManageMembers).toBe(true);
    expect(p.canDelete).toBe(false);
  });

  it("editor edits only", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, editor]), 7);
    expect(p.role).toBe("editor");
    expect(p.canEdit).toBe(true);
    expect(p.canManageProjects).toBe(false);
    expect(p.canDelete).toBe(false);
  });

  it("viewer only views", () => {
    const p = resolveGroupPermissions(groupFor(5, [owner, viewer]), 8);
    expect(p.role).toBe("viewer");
    expect(p.canView).toBe(true);
    expect(p.canEdit).toBe(false);
  });

  it("treats owner_user_id as owner even without a members list", () => {
    const p = resolveGroupPermissions({ owner_user_id: 5 }, 5);
    expect(p.role).toBe("owner");
    expect(p.canDelete).toBe(true);
  });
});
