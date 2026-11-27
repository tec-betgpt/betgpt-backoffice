<template>
  <SidebarProvider :default-open="false">
    <div class="flex min-h-svh w-full bg-background">
      <aside class="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <ShellSidebar :groups="navGroups" :area="navArea" />
      </aside>

      <Sheet v-model:open="mobileNavOpen">
        <SheetContent side="left" class="w-72 p-0 [&>button]:hidden">
          <ShellSidebar :groups="navGroups" :area="navArea" @navigated="mobileNavOpen = false" />
        </SheetContent>
      </Sheet>

      <div
        class="flex min-w-0 flex-1 flex-col transition-[margin] duration-200 lg:ml-64"
        :class="sidebarAi && showAi ? 'xl:mr-[440px]' : ''"
      >
        <header class="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
          <div class="flex h-14 items-center gap-2 px-4 sm:px-6">
            <Button variant="ghost" size="icon" class="-ml-2 lg:hidden" @click="mobileNavOpen = true">
              <PanelLeft class="size-5" />
            </Button>

            <nav class="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              <template v-for="(crumb, index) in breadcrumbs" :key="index">
                <ChevronRight v-if="index > 0" class="size-3.5 shrink-0 text-muted-foreground" />
                <router-link
                  v-if="crumb.to"
                  :to="crumb.to"
                  class="truncate text-muted-foreground hover:text-foreground"
                  :class="index < breadcrumbs.length - 1 && 'hidden sm:inline'"
                >
                  {{ crumb.label }}
                </router-link>
                <span
                  v-else
                  class="truncate"
                  :class="index === breadcrumbs.length - 1 ? 'font-medium' : 'hidden text-muted-foreground sm:inline'"
                >
                  {{ crumb.label }}
                </span>
              </template>
            </nav>

            <Button
              variant="outline"
              size="sm"
              class="hidden h-8 gap-2 text-muted-foreground md:flex"
              @click="shell.paletteOpen = true"
            >
              <Search class="size-3.5" />
              Buscar
              <kbd class="rounded border bg-muted px-1.5 text-[10px] font-medium">⌘K</kbd>
            </Button>
            <Button variant="ghost" size="icon" class="md:hidden" @click="shell.paletteOpen = true">
              <Search class="size-4" />
            </Button>

            <Button variant="ghost" size="icon" :title="isShowValues ? 'Esconder valores' : 'Mostrar valores'" @click="isShowValues = !isShowValues">
              <Eye v-if="isShowValues" class="size-4 text-primary" />
              <EyeClosed v-else class="size-4 text-primary" />
            </Button>

            <template v-if="showAi">
              <IAAnaliseButton v-if="!hideIAButton" @open-sidebar="sidebarAi = true" />
              <SidebarTrigger
                :logo="true"
                :toggle="toggleSidebarIA"
                :logo-custom="logoCustomAi"
                :open="sidebarAi"
              />
            </template>
          </div>

          <div
            v-if="isMember && area === 'workspace'"
            class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-zinc-900 px-4 py-2 text-xs text-zinc-100 sm:px-6 dark:bg-zinc-800"
          >
            <span class="flex min-w-0 items-center gap-2">
              <ShieldCheck class="size-3.5 shrink-0 text-amber-400" />
              <span class="truncate">
                Você está em <b>{{ activeWorkspace?.name }}</b> como Elevate
              </span>
            </span>
            <label class="flex cursor-pointer items-center gap-2">
              <Switch
                v-model="shell.viewAsClient"
                class="scale-75 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-white/25 [&>span]:bg-white"
              />
              Ver como cliente
            </label>
            <router-link
              :to="{ name: 'admin.home' }"
              class="ml-auto flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 font-medium hover:bg-white/20"
            >
              <ArrowLeft class="size-3.5" />
              Voltar ao Admin
            </router-link>
          </div>
        </header>

        <CustomLoading v-if="configStore.loading" />
        <main v-else class="flex-1 px-4 pb-10 pt-4 sm:px-6">
          <div class="mx-auto w-full min-w-0">
            <div
              v-if="financeBanner"
              class="mb-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
            >
              <component :is="financeBanner.icon" class="size-4 shrink-0 text-primary" />
              <span><b>{{ financeBanner.title }}</b> · <span class="text-muted-foreground">{{ financeBanner.text }}</span></span>
            </div>
            <router-view
              v-if="activeWorkspace || area !== 'workspace'"
              :key="area === 'workspace' ? activeWorkspace?.id : 'admin'"
              :is-show-values="isShowValues"
            />
          </div>
        </main>
        <InviteBanner />
      </div>
    </div>

    <RightMenuComponent v-if="showAi" v-model:sidebar-ai="sidebarAi" />
    <CommandPalette />

    <div v-if="isImpersonating" class="pointer-events-none fixed bottom-6 right-6 z-[200]">
      <Button type="button" variant="destructive" class="pointer-events-auto shadow-lg" @click="exitImpersonation">
        <LogOut class="mr-2 size-4" />
        Sair da simulação
      </Button>
    </div>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { storeToRefs } from "pinia";
import { useColorMode } from "@vueuse/core";
import { ArrowLeft, Building2, ChevronRight, Eye, EyeClosed, Landmark, Layers, LogOut, PanelLeft, Search, ShieldCheck } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import IAAnaliseButton from "@/components/custom/IAAnaliseButton.vue";
import RightMenuComponent from "@/components/layout/RightMenuComponent.vue";
import InviteBanner from "@/components/groups/InviteBanner.vue";
import ShellSidebar from "@/layouts/v2/ShellSidebar.vue";
import CommandPalette from "@/layouts/v2/CommandPalette.vue";
import { useAuthStore } from "@/stores/auth";
import { useConfigStore } from "@/stores/config";
import { useGroupsStore } from "@/stores/groups";
import { useShellStore } from "@/stores/shell";
import { useWorkspaceStore } from "@/stores/workspace";
import { useNavAccess } from "@/navigation/access";
import { ACCOUNT_NAV, ADMIN_NAV, WORKSPACE_NAV, areaOfRoute } from "@/navigation/registry";
import Auth from "@/services/auth";

const route = useRoute();
const router = useRouter();
const mode: any = useColorMode();
const auth = useAuthStore();
const configStore = useConfigStore();
const groupsStore = useGroupsStore();
const shell = useShellStore();
const workspace = useWorkspaceStore();
const { isImpersonating } = storeToRefs(auth);
const { isMember, visibleGroups, resolveTo } = useNavAccess();

const mobileNavOpen = ref(false);
const sidebarAi = ref(false);
const isShowValues = ref(false);

const activeWorkspace = computed(() => workspace.activeGroupProject);
const area = computed(() => areaOfRoute(route.name as string));
// A conta pessoal aparece com o menu de onde a pessoa veio.
const navArea = computed<"admin" | "workspace">(() => {
  if (area.value === "account") return shell.lastArea === "workspace" || !isMember.value ? "workspace" : "admin";
  return area.value as "admin" | "workspace";
});
const navGroups = computed(() =>
  visibleGroups(navArea.value === "admin" ? ADMIN_NAV : WORKSPACE_NAV, navArea.value),
);

const showAi = computed(
  () => area.value === "workspace" && !route.matched.some((r) => Boolean(r.meta?.hideRightMenuAi)),
);

const hideIAButton = computed(() =>
  ["configurations", "elevate-ia", "jarbas-bot", "governance", "exports", "elevate-api", "conversions", "manage"].some(
    (part) => route.fullPath.includes(part),
  ),
);

const logoCustomAi = computed(() =>
  mode.value === "dark" ? "/svg/logo-ia-v1-white.svg" : "/svg/logo-ia-v1-black.svg",
);

const FINANCE_ROUTES = ["registers", "sectors", "costs", "financial.resource-usage", "financial.ledger"];

const financeBanner = computed(() => {
  if (route.meta.financeScope === "elevate") {
    return { icon: Landmark, title: "Financeiro da Elevate", text: "lançamentos da própria empresa, que nenhum cliente vê." };
  }
  if (route.meta.financeScope === "all") {
    return { icon: Layers, title: "Consumo de todas as contas", text: "soma de todos os projetos dos clientes." };
  }
  const name = String(route.name ?? "");
  if (FINANCE_ROUTES.some((r) => name === `workspace.${r}`)) {
    return { icon: Building2, title: `Financeiro de ${activeWorkspace.value?.name ?? "este workspace"}`, text: "o que for lançado aqui fica neste workspace." };
  }
  return null;
});

const toggleSidebarIA = () => {
  localStorage.setItem("sidebarAi", sidebarAi.value ? "0" : "1");
  sidebarAi.value = !sidebarAi.value;
};

type Crumb = { label: string; to?: RouteLocationRaw };

const breadcrumbs = computed<Crumb[]>(() => {
  const name = route.name as string;
  const title = (route.meta.title as string) || "";

  if (area.value === "account") {
    const item = ACCOUNT_NAV.find((i) => (i.to as any).name === name);
    return [{ label: "Conta", to: { name: "configurations.profile" } }, { label: item?.label ?? title }];
  }

  const root: Crumb =
    area.value === "admin"
      ? { label: "Admin Elevate", to: { name: "admin.home" } }
      : { label: activeWorkspace.value?.name ?? "Workspace", to: { name: "workspace.home" } };

  if (name === "admin.home" || name === "workspace.home") return [{ label: root.label }];

  for (const group of area.value === "admin" ? ADMIN_NAV : WORKSPACE_NAV) {
    const item = group.items.find(
      (i) => resolveTo(i)?.name === name || i.activeFor?.includes(name),
    );
    if (!item) continue;
    const crumbs: Crumb[] = [root];
    if (group.label) crumbs.push({ label: group.label });
    const isDetail = resolveTo(item)?.name !== name;
    crumbs.push(isDetail ? { label: item.label, to: resolveTo(item)! } : { label: item.label });
    if (isDetail && title) crumbs.push({ label: title });
    return crumbs;
  }

  return [root, { label: title }];
});

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
  },
);

watch(showAi, (value) => {
  if (!value) sidebarAi.value = false;
});

const exitImpersonation = async () => {
  try {
    await Auth.logout();
  } catch (_) {
    /* token pode já ter expirado */
  }
  const restored = auth.restoreAdminSessionFromBackup();
  if (!restored) {
    auth.clearUserData();
  } else {
    try {
      await auth.fetchUser();
      const user: any = auth.user;
      if (user) await workspace.loadInitialData(user.preferences, user.group_projects);
    } catch (_) {
      //
    }
  }
  window.close();
  setTimeout(() => {
    if (!restored) router.push({ name: "login" });
  }, 250);
};

onMounted(() => {
  mode.value = localStorage.getItem("theme") || "auto";
  if (auth.user) groupsStore.fetchMyInvitations().catch(() => undefined);
});
</script>
