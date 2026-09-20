import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { hasManagementProfile, useManagementProfile } from "@/composables/useManagementProfile";

function userWithRoles(...names: string[]) {
  return { roles: names.map((name) => ({ name })) };
}

describe("useManagementProfile", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it.each(["member-proprietor", "member-admin", "member-developer"])(
    "grants management profile for %s",
    (roleName) => {
      expect(hasManagementProfile(userWithRoles(roleName))).toBe(true);
    },
  );

  it("denies non-management roles", () => {
    expect(hasManagementProfile(userWithRoles("member-viewer"))).toBe(false);
    expect(hasManagementProfile(null)).toBe(false);
    expect(hasManagementProfile({})).toBe(false);
  });

  it("reflects the authenticated user in the composable", () => {
    const authStore = useAuthStore();
    authStore.user = userWithRoles("member-admin") as any;
    const { canManageGroups } = useManagementProfile();
    expect(canManageGroups.value).toBe(true);
  });
});
