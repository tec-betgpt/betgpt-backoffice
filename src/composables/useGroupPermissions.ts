import { computed, type ComputedRef, type Ref } from "vue";

export type GroupRole = "owner" | "admin" | "editor" | "viewer";

export interface GroupPermissionInput {
  owner_user_id: number;
  members?: Array<{ user_id: number; role: GroupRole }>;
}

export interface GroupPermissions {
  role: GroupRole | null;
  isOwner: boolean;
  canView: boolean;
  canEdit: boolean;
  canManageProjects: boolean;
  canManageMembers: boolean;
  canManageInvitations: boolean;
  canDelete: boolean;
}

const NO_PERMISSIONS: GroupPermissions = {
  role: null,
  isOwner: false,
  canView: false,
  canEdit: false,
  canManageProjects: false,
  canManageMembers: false,
  canManageInvitations: false,
  canDelete: false,
};

export function resolveGroupPermissions(
  group: GroupPermissionInput | null | undefined,
  userId: number | null | undefined,
): GroupPermissions {
  if (!group || userId == null) return { ...NO_PERMISSIONS };

  const member = group.members?.find((m) => m.user_id === userId);
  const isOwner = group.owner_user_id === userId || member?.role === "owner";
  const role: GroupRole | null = isOwner ? "owner" : member?.role ?? null;

  if (!role) return { ...NO_PERMISSIONS };

  const isAdmin = role === "owner" || role === "admin";

  return {
    role,
    isOwner,
    canView: true,
    canEdit: isAdmin || role === "editor",
    canManageProjects: isAdmin,
    canManageMembers: isAdmin,
    canManageInvitations: isAdmin,
    canDelete: isOwner,
  };
}

export function useGroupPermissions(
  group: Ref<GroupPermissionInput | null | undefined>,
  userId: Ref<number | null | undefined>,
): ComputedRef<GroupPermissions> {
  return computed(() => resolveGroupPermissions(group.value, userId.value));
}
