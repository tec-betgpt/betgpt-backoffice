import { computed, type ComputedRef } from "vue";
import { useAuthStore } from "@/stores/auth";

/** Perfis de conta que podem criar grupos e vincular/editar projetos. */
export const MANAGEMENT_PROFILE_ROLES = [
  "member-proprietor",
  "member-admin",
  "member-developer",
] as const;

export function hasManagementProfile(user: unknown): boolean {
  const roles = (user as { roles?: Array<{ name?: string }> } | null)?.roles;
  return (
    roles?.some((role) =>
      (MANAGEMENT_PROFILE_ROLES as readonly string[]).includes(role?.name ?? ""),
    ) ?? false
  );
}

export function useManagementProfile(): {
  canManageGroups: ComputedRef<boolean>;
} {
  const authStore = useAuthStore();
  const canManageGroups = computed(() => hasManagementProfile(authStore.user));
  return { canManageGroups };
}
