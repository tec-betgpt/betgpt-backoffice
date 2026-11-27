import type { Component } from "vue";
import type {
  RouteLocationRaw,
  RouteMeta,
  RouteRecordRaw,
  Router,
} from "vue-router";
import { areaOfRoute, type Area } from "@/navigation/registry";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import { useShellStore } from "@/stores/shell";
import { canUseV2, switchUiVersion } from "@/navigation/uiVersion";
import type { FixedFinanceScope } from "@/composables/useWorkspaceScope";

export const ADMIN_PREFIX = "/admin";
export const WORKSPACE_PREFIX = "/w/:workspace";
export const ACCOUNT_PREFIX = "/conta";

const LEGACY_ROUTE = "v2.legacy";

// Financeiro: no Admin é o da própria Elevate (ou o consumo de todas as contas);
// a cópia em /w/:workspace é o financeiro do cliente.
const FINANCE_SCOPES: Record<string, FixedFinanceScope> = {
  registers: "elevate",
  sectors: "elevate",
  costs: "elevate",
  "financial.resource-usage": "all",
  "financial.ledger": "all",
};
export const workspaceTwin = (name: string) => `workspace.${name}`;

interface BuildOptions {
  shell: Component;
  legacyLayout: Component;
  accountLayout: Component;
  homeAdmin: Component;
  homeWorkspace: Component;
  homeClassic: Component;
  empty: Component;
}

const joinPath = (base: string, child: string) => {
  if (!child) return base;
  if (child.startsWith("/")) return child;
  return `${base.replace(/\/$/, "")}/${child}`;
};

const prefixFor = (area: Area) => (area === "admin" ? ADMIN_PREFIX : WORKSPACE_PREFIX);

/**
 * Monta as rotas da v2 a partir das rotas atuais: mesmos nomes e telas,
 * endereços em /admin, /w/:workspace e /conta, todas dentro da casca nova.
 */
export function buildV2Routes(routes: RouteRecordRaw[], opts: BuildOptions): RouteRecordRaw[] {
  const out: RouteRecordRaw[] = [];
  const accountChildren: RouteRecordRaw[] = [];

  const withShell = (meta: RouteMeta = {}): RouteMeta =>
    meta.layout === opts.legacyLayout ? { ...meta, layout: opts.shell } : meta;

  const authMeta = (title: string): RouteMeta => ({ layout: opts.shell, requiresAuth: true, title });

  const pushLeaf = (record: any, fullPath: string, parentMeta: RouteMeta) => {
    const meta = withShell({ ...parentMeta, ...(record.meta ?? {}) });
    const area = areaOfRoute(record.name);
    const { children: _children, ...rest } = record;
    out.push({ ...rest, path: prefixFor(area) + fullPath, meta } as RouteRecordRaw);
  };

  const flatten = (record: any, basePath: string, parentMeta: RouteMeta) => {
    const fullPath = joinPath(basePath, record.path);

    if (!record.children?.length) {
      pushLeaf(record, fullPath, parentMeta);
      return;
    }

    // Pai com tela própria (ex.: detalhe do grupo) continua aninhado.
    if (record.component) {
      const area = areaOfRoute(record.name);
      out.push({ ...record, path: prefixFor(area) + fullPath, meta: withShell(record.meta) });
      return;
    }

    if (record.name || record.redirect) {
      const firstNamed = record.children.find((c: any) => c.name);
      const redirect = record.redirect ?? (firstNamed ? { name: firstNamed.name } : undefined);
      if (redirect) {
        out.push({
          path: prefixFor(areaOfRoute(record.name ?? firstNamed?.name)) + fullPath,
          ...(record.name ? { name: record.name } : {}),
          redirect,
        } as RouteRecordRaw);
      }
    }

    const meta = { ...parentMeta, ...(record.meta ?? {}) };
    record.children.forEach((child: any) => flatten(child, fullPath, meta));
  };

  for (const record of routes as any[]) {
    if (record.name === "home") {
      out.push({ path: "/home", name: "home", component: opts.empty, meta: authMeta("Home") });
      continue;
    }

    if (!record.meta?.requiresAuth && !record.children?.some((c: any) => c.meta?.requiresAuth)) {
      out.push(record);
      continue;
    }

    if (record.path === "/configurations") {
      for (const child of record.children ?? []) {
        if (child.path === "") continue;
        if (areaOfRoute(child.name) === "account") {
          accountChildren.push({ ...child, meta: { ...child.meta, layout: opts.shell } });
        } else {
          flatten(child, record.path, record.meta ?? {});
        }
      }
      continue;
    }

    flatten(record, "", {});
  }

  for (const record of [...out]) {
    const scope = typeof record.name === "string" ? FINANCE_SCOPES[record.name] : undefined;
    if (!scope) continue;
    record.meta = { ...record.meta, financeScope: scope };
    out.push({
      ...record,
      name: workspaceTwin(record.name as string),
      path: record.path.replace(ADMIN_PREFIX, WORKSPACE_PREFIX),
      meta: { ...record.meta, financeScope: undefined },
    } as RouteRecordRaw);
  }

  out.push(
    { path: ADMIN_PREFIX, name: "admin.home", component: opts.homeAdmin, meta: authMeta("Visão geral") },
    { path: WORKSPACE_PREFIX, name: "workspace.home", component: opts.homeWorkspace, meta: authMeta("Dashboard") },
    { path: `${WORKSPACE_PREFIX}/home-classica`, name: "home.classic", component: opts.homeClassic, meta: authMeta("Dashboard clássico") },
    {
      path: ACCOUNT_PREFIX,
      component: opts.accountLayout,
      meta: { requiresAuth: true, title: "Minha conta" },
      children: [{ path: "", redirect: { name: "configurations.profile" } }, ...accountChildren],
    },
    { path: "/:pathMatch(.*)*", name: LEGACY_ROUTE, component: opts.empty, meta: authMeta("") },
  );

  return out;
}

/** Na versão atual, leva endereços da v2 (links salvos, troca de versão) para o equivalente. */
export const v1FallbackRoutes: RouteRecordRaw[] = [
  { path: `${ADMIN_PREFIX}/:rest(.*)*`, redirect: (to) => legacyPath(to.params.rest) },
  { path: `/w/:workspace/:rest(.*)*`, redirect: (to) => legacyPath(to.params.rest) },
  { path: `${ACCOUNT_PREFIX}/:rest(.*)*`, redirect: (to) => `/configurations/${[to.params.rest].flat().join("/")}` },
];

function legacyPath(rest: unknown) {
  const path = [rest].flat().filter(Boolean).join("/");
  return path ? `/${path}` : "/home";
}

function activeWorkspaceKey(router: Router): string | null {
  const current = router.currentRoute.value.params.workspace;
  if (typeof current === "string" && current) return current;
  return useWorkspaceStore().activeGroupProject?.id ?? null;
}

async function ensureWorkspaces() {
  const auth = useAuthStore();
  const workspace = useWorkspaceStore();
  const user: any = auth.user;
  if (user && !workspace.group_projects.length) {
    await workspace.loadInitialData(user.preferences ?? {}, user.group_projects ?? []);
  }
}

export function installV2Navigation(router: Router) {
  const needsWorkspace = new Set(
    router
      .getRoutes()
      .filter((r) => r.path.startsWith(WORKSPACE_PREFIX) && r.name)
      .map((r) => r.name as string),
  );

  // Telas que navegam por nome a partir do Admin não sabem do :workspace.
  const fill = (to: RouteLocationRaw): RouteLocationRaw => {
    if (typeof to !== "object" || !("name" in to) || typeof to.name !== "string") return to;
    if (!needsWorkspace.has(to.name) || (to.params as any)?.workspace) return to;
    const workspace = activeWorkspaceKey(router);
    return workspace ? { ...to, params: { ...(to.params ?? {}), workspace } } : to;
  };

  const { push, replace, resolve } = router;
  router.push = (to) => push(fill(to));
  router.replace = (to) => replace(fill(to));
  router.resolve = ((to: any, current?: any) => resolve(fill(to), current)) as Router["resolve"];

  router.beforeEach(async (to) => {
    const auth = useAuthStore();
    const user: any = auth.user;
    if (!to.meta.requiresAuth || !user) return true;

    if (!canUseV2(user) && !auth.isImpersonating) {
      switchUiVersion("v1", to.fullPath);
      return false;
    }

    await ensureWorkspaces();
    const workspace = useWorkspaceStore();
    const shell = useShellStore();
    const isMember = user.access_type === "member";
    const fallbackKey = workspace.activeGroupProject?.id ?? workspace.group_projects[0]?.id ?? null;

    if (to.name === "home") {
      const wantsAdmin = isMember && shell.lastArea !== "workspace";
      if (wantsAdmin || !fallbackKey) return { name: "admin.home", replace: true };
      return { name: "workspace.home", params: { workspace: fallbackKey }, replace: true };
    }

    if (to.name === LEGACY_ROUTE) {
      const candidates = [
        fallbackKey ? `/w/${fallbackKey}${to.path}` : null,
        `${ADMIN_PREFIX}${to.path}`,
        to.path.startsWith("/configurations/") ? to.path.replace("/configurations", ACCOUNT_PREFIX) : null,
      ];
      for (const path of candidates) {
        if (!path) continue;
        const match = resolve(path);
        if (match.matched.length && match.name !== LEGACY_ROUTE) {
          return { path, query: to.query, hash: to.hash, replace: true };
        }
      }
      return { name: "home", replace: true };
    }

    const area = areaOfRoute(to.name as string);


    if (area === "admin" && !isMember) return { name: "home", replace: true };

    const key = to.params.workspace;
    if (typeof key === "string") {
      const target = workspace.group_projects.find((item) => item.id === key);
      if (!target) {
        if (!fallbackKey || fallbackKey === key) return { name: "home", replace: true };
        return { name: to.name as string, params: { ...to.params, workspace: fallbackKey }, query: to.query, replace: true };
      }
      if (workspace.activeGroupProject?.id !== target.id) {
        await workspace.setActiveGroupProject(target);
      }
      shell.rememberWorkspace(target.id);
    }

    shell.setArea(area);
    return true;
  });
}
