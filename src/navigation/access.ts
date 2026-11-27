import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMarketingApiKeysStore } from "@/stores/marketingApiKeys";
import { resolveGroupIdFromWorkspaceKey } from "@/services/marketingApiKeys";
import { useShellStore } from "@/stores/shell";
import type { Area, NavContext, NavGroup, NavItem } from "@/navigation/registry";

export function useNavAccess() {
  const auth = useAuthStore();
  const workspace = useWorkspaceStore();
  const marketingApiKeys = useMarketingApiKeysStore();
  const shell = useShellStore();

  const roles = computed<any[]>(() => (auth.user as any)?.roles ?? []);
  const isMember = computed(() => (auth.user as any)?.access_type === "member");

  const ctx = computed<NavContext>(() => ({
    projectId: workspace.isGroupWorkspace ? null : workspace.numericProjectId,
    groupId: workspace.numericGroupId,
    workspaceType: (workspace.activeGroupProject?.type as "project" | "group") ?? null,
    canManageMarketingApiKeys: marketingApiKeys.canManageGroup(
      resolveGroupIdFromWorkspaceKey(workspace.activeGroupProject?.id),
    ),
  }));

  // O perfil `member` não vem na lista de perfis; vale o access_type.
  const hasRole = (names: string[]) =>
    (isMember.value && names.includes("member")) || roles.value.some((r) => names.includes(r.name));

  const hasPermission = (perms: string[], projectId: number | null = null) =>
    roles.value.some(
      (r) =>
        (projectId === null || Number(r.pivot?.project_id) === projectId) &&
        r.permissions?.some((p: any) => perms.includes(p.name)),
    );

  // Cliente só vale o que tem no projeto aberto; grupo e membro seguem a regra da versão atual.
  const allowedByPermission = (perms: string[], area: Area) => {
    if (area === "admin" || isMember.value || ctx.value.workspaceType !== "project") {
      return hasPermission(perms);
    }
    return hasPermission(perms, ctx.value.projectId);
  };

  const canSee = (item: NavItem, area: Area) => {
    if (area === "admin" && !isMember.value) return false;
    if (item.internal && (!isMember.value || shell.viewAsClient)) return false;
    if (item.workspaceType && item.workspaceType !== ctx.value.workspaceType) return false;
    if (item.when && !item.when(ctx.value)) return false;

    if (!item.perm && !item.roles) return true;
    return Boolean(
      (item.perm && allowedByPermission(item.perm, area)) || (item.roles && hasRole(item.roles)),
    );
  };

  const resolveTo = (item: NavItem) => (typeof item.to === "function" ? item.to(ctx.value) : item.to);

  const visibleGroups = (groups: NavGroup[], area: Area) =>
    groups
      .filter((g) => !(g.internal && (!isMember.value || shell.viewAsClient)))
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => canSee(i, area) && resolveTo(i) !== null),
      }))
      .filter((g) => g.items.length > 0);

  return { isMember, ctx, canSee, resolveTo, visibleGroups, hasRole };
}
