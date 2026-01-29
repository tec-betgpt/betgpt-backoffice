<template>
  <Sidebar
    class="h-screen"
    collapsible="icon"
    :openMobile="false"
    @update:modelValue="handleSidebarExpand"
    :collapsed="sidebarExpanded"
  >
    <div
      v-if="authStore && authStore.user && !authStore.user.is_available"
      class="bg-gray-50/5 w-full h-full backdrop-blur-lg absolute top-0 left-0 z-10 flex flex-col items-center justify-center px-4 text-center"
    >
      <LucideLockOpen />
      <div class="text-sm font-bold">Conta suspensa</div>
      <div class="text-xs">
        Por favor, efetue o pagamento das faturas pendentes.
      </div>
    </div>

    <SidebarHeader v-if="activeGroupProject">
      <img
        @click="toggleSidebar"
        :src="logoSrc"
        alt="Logo"
        :class="{
          'w-1/2 py-4': sidebarExpanded,
          'w-6 py-1': !sidebarExpanded,
        }"
        class="m-auto transition-transform duration-200 ease-linear hover:scale-105 cursor-pointer"
      />

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-sidebar-primary-foreground"
                >
                  <Avatar shape="square" class="size-7">
                    <AvatarImage
                      v-if="activeGroupProject && activeGroupProject.logo"
                      :src="activeGroupProject.logo"
                    />
                    <AvatarImage v-else src="/default-project.jpg" />
                    <AvatarFallback class="uppercase text-white">
                      {{ activeGroupProject.name.slice(0, 2) }}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">
                    {{ activeGroupProject.name }}
                  </span>
                  <span class="truncate text-xs">
                    {{ $t(activeGroupProject.type) }}
                  </span>
                </div>
                <ChevronsUpDown class="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side="bottom"
              :side-offset="4"
            >
              <ScrollArea class="max-h-[50vh] w-auto overflow-auto">
                <DropdownMenuLabel class="text-xs text-muted-foreground">
                  Projetos
                </DropdownMenuLabel>
                <DropdownMenuItem
                  v-for="project in workspaceStore.group_projects"
                  :key="project.name"
                  class="gap-2 p-2"
                  @click="setActiveGroupProject(project)"
                >
                  <div
                    class="flex size-6 items-center justify-center rounded-sm border"
                  >
                    <Avatar shape="square" class="size-7">
                      <AvatarImage v-if="project.logo" :src="project.logo" />
                      <AvatarImage v-else src="/default-project.jpg" />
                      <AvatarFallback class="uppercase text-white">
                        {{ project.name.slice(0, 2) }}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {{ project.name }}
                </DropdownMenuItem>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarMenu>
          <template v-for="item in navMenu" :key="item.name">
            <SidebarMenuItem v-if="!item.children && item.show">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton
                      as-child
                      :is-active="route.name === item.url.name"
                      :tooltip="item.name"
                      @click="toggleCollapsed('')"
                    >
                      <router-link
                        :to="item.url"
                        class="flex items-center p-2 rounded-md transition-colors"
                      >
                        <component :is="item.icon" />
                        <span>{{ item.name }}</span>
                      </router-link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    :align-offset="4"
                    :arrow-padding="8"
                    avoid-collisions
                    :collision-padding="10"
                    hide-when-detached
                    position-strategy="absolute"
                    sticky="always"
                    update-position-strategy="optimized"
                    :collision-boundary="null"
                  >
                    {{ item.name }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
            <Collapsible
              v-else-if="item.show && item.children"
              :key="item.name"
              as-child
              class="group/collapsible"
              :open="item.type === collapsed"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton
                    :tooltip="item.name"
                    @click="toggleCollapsed(item.type)"
                  >
                    <div
                      class="flex items-center flex-col justify-center gap-1"
                    >
                      <Component :is="item.icon" :size="16" />
                    </div>
                    <span>{{ item.name }}</span>
                    <ChevronRight
                      :stroke-width="1.3"
                      class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <template v-for="child in item.children">
                      <SidebarMenuSubItem v-if="child.show" :key="child.name">
                        <SidebarMenuSubButton
                          as-child
                          :isActive="route.name === child.url.name"
                          @click="toggleCollapsed('')"
                        >
                          <router-link
                            :to="child.url"
                            class="flex items-center p-2 rounded-md transition-colors"
                            :class="{
                              'bg-sidebar-accent text-sidebar-accent-foreground':
                                route.name === child.url.name,
                              'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground': true,
                            }"
                          >
                            <component :is="child.icon" class="mr-2" />
                            <span>{{ child.name }}</span>
                          </router-link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </template>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </template>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <ServicesPreviewComponent />

    <SidebarFooter class="z-20">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage v-if="authStore.user" :src="authStore.user?.icon" />
              <AvatarFallback class="rounded-lg text-white">
                {{ authStore.user?.initials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">
                {{ authStore.user?.first_name }}
              </span>
              <span class="truncate text-xs">
                {{ authStore.user?.email }}
              </span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side="bottom"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuItem>
            <router-link
              class="w-full"
              :to="{ name: 'configurations.profile' }"
            >
              Configurações
            </router-link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <router-link
              class="w-full"
              :to="{ name: 'service-consumeds.index' }"
            >
              Serviços Consumidos
            </router-link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem @click="logout">
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  Sidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Home,
  LineChart,
  Building2,
  ListFilter,
  Users2,
  Bot,
  LogOut,
  ChevronsUpDown,
  Send,
  ChartNoAxesCombined,
  MailCheck,
  Album,
  SlidersHorizontal,
  View,
  Rows3,
  ChevronRight,
  SquareStack,
  CircleDollarSign,
  ExternalLink,
  Briefcase,
  DollarSignIcon,
  Blocks,
  Logs,
  UserCog,
  LayoutList,
  Download,
  History,
  LucideShieldUser,
  SquarePen,
  Square,
  LucideLockOpen,
  LucideUserCheck,
  ChartArea,
  Goal, ShieldAlert,
  FileText,
} from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useColorMode } from "@vueuse/core";
import { useConfigStore } from "@/stores/config";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import { computed, ref, watch, defineModel } from "vue";
import ServicesPreviewComponent from "@/components/layout/ServicesPreviewComponent.vue";

const sidebarExpanded = defineModel<boolean>("sidebarExpanded");

const DARK_LOGOS = {
  square: "/logo-elevate-square-white.png",
  full: "/logo-elevate-white.png",
};

const LIGHT_LOGOS = {
  square: "/logo-elevate-square-black.png",
  full: "/logo-elevate-black.png",
};

// Refs e stores
const collapsed = ref("");
const mode: any = useColorMode();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

// Computed
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const logoSrc = computed(() =>
  getLogoSrc(mode.value === "dark", sidebarExpanded.value)
);

const navMenu = computed(() => {
  return [
    {
      name: "Home",
      url: { name: "home" },
      icon: Home,
      show: canAccess("access-to-dashboard"),
    },
    // {
    //   name: "Elevate IA",
    //   icon: Bot,
    //   type: "ia",
    //   show: canAccess("access-to-ai"),
    //   children: [
    //     {
    //       name: "Insights IA",
    //       url: { name: "insightIA" },
    //       icon: Bot,
    //       show: canAccess("member-proprietor") || canAccess("member-admin"),
    //     },
    //   ]
    // },
    {
      name: "Jarbas BOT",
      icon: Bot,
      url: { name: "jarbas-bot" },
      type: "ia",
      show: canAccess("access-to-ai"),
    },
    {
      name: "Audiências",
      icon: View,
      type: "audiences",
      show: canAccess("access-to-reports"),
      children: [
        {
          name: "Clientes",
          url: { name: "clients" },
          icon: Users2,
          show: canAccess("player-registrations"),
        },
        {
          name: "Segmentos",
          url: { name: "segments" },
          icon: ListFilter,
          show: canAccess("view-segments"),
        },
        {
          name: "Publico Alvo",
          url: { name: "target-audiences" },
          icon: ListFilter,
          show: canAccess("view-segments"),
        },
        {
          name: "Atribuições",
          url: { name: "attributions" },
          icon: ExternalLink,
          show: canAccess("access-to-parameter-tracking"),
        },
        {
          name: "Exportações",
          url: { name: "exports" },
          icon: Download,
          show: canAccess("access-to-exportations"),
        },
      ],
    },
    {
      name: "Conversões",
      icon: ChartArea,
      type: "conversions",
      show: canAccess("view-events"),
      children: [
        {
          name: "Definições",
          url: { name: "definitions" },
          icon: ChartArea,
          show: canAccess("view-events"),
        },
        {
          name: "Relatórios",
          url: { name: "reports" },
          icon: ChartArea,
          show: canAccess("view-events"),
        },
        {
            name: "Resultados",
            url: { name: "ConversionAnalytics" },
            icon: Goal,
            show: canAccess("view-events"),
        },
      ],
    },
    {
      name: "Controles",
      icon: SlidersHorizontal,
      type: "controls",
      show: canAccess("access-to-reports"),
      children: [
        {
          name: "Performance",
          url: { name: "performances" },
          icon: LineChart,
          show: canAccess("access-to-reports"),
        },
        {
          name: "Tráfego",
          url: { name: "traffics" },
          icon: ChartNoAxesCombined,
          show: canAccess("access-to-reports"),
        },
        {
          name: "E-mails",
          url: { name: "emails" },
          icon: MailCheck,
          show: canAccess("access-to-reports"),
        },
        {
          name: "SMS Insights",
          url: { name: "sms-insights" },
          icon: Send,
          show: canAccess("access-to-reports"),
        },
        {
          name: "Elevate API",
          url: { name: "elevate-api" },
          icon: Logs,
          show: canAccess("access-to-postback-logs"),
        },
      ],
    },
    {
      name: "Gerenciamento",
      icon: SquareStack,
      type: "manage",
      show:
        canAccess("access-to-client-management") ||
        canAccess("access-to-member-management"),
      children: [
        {
          name: "Grupo de Projetos",
          url: { name: "configurations.projects" },
          icon: LayoutList,
          show: canAccess("access-to-project-groups"),
        },

        {
          name: "Projetos",
          url: { name: "projects" },
          icon: Building2,
          show: canAccess("access-to-project-groups"),
        },
        {
          name: "Fontes de Dados",
          url: { name: "data-sources" },
          icon: Blocks,
          show:
            canAccess("access-to-integrations") &&
            activeGroupProject.value?.type === "project",
        },
      ],
    },
    {
      name: "Governança",
      icon: Square,
      type: "governance",
      show:
        canAccess("access-to-client-governance") ||
        canAccess("access-to-member-governance"),
      children: [
        {
          name: "Usuários",
          url: { name: "users" },
          icon: Users2,
          show: canAccess("access-to-users"),
        },
        {
          name: "Perfis",
          url: { name: "roles" },
          icon: UserCog,
          show: canAccess("access-to-roles"),
        },
        {
          name: "Permissões",
          url: { name: "permissions" },
          icon: LucideShieldUser,
          show: canAccess("access-to-permissions"),
        },
        {
          name: "Assinantes",
          url: { name: "subscribers" },
          icon: LucideUserCheck,
          show:
            hasRole("member-proprietor") ||
            hasRole("member-admin") ||
            canAccess("access-to-subscribers"),
        },
        {
          name: "Serviços",
          url: { name: "services" },
          icon: Briefcase,
          show:
            hasRole("member-proprietor") ||
            hasRole("member-admin") ||
            canAccess("access-to-services"),
        },
        {
          name: "MyElevate Insights",
          url: { name: "texts" },
          icon: Album,
          show:
            hasRole("member-proprietor") ||
            hasRole("member-admin") ||
            canAccess("access-to-motivational-texts"),
        },
        {
          name: "Logins",
          url: { name: "user-logins" },
          icon: History,
          show: hasRole("member-proprietor") || hasRole("member-admin"),
        },
        {
          name: "Insights IA",
          url: { name: "insightIA" },
          icon: Bot,
          show: hasRole("member-proprietor"),
        },
        {
          name: "Listas de Proteção",
          url: { name: "protection-lists" },
          icon: ShieldAlert,
          show: hasRole("member-proprietor") || hasRole("member-admin") || canAccess("access-to-protection-lists"),
        },
        {
          name: "Relatórios de Proteção",
          url: { name: "protection-list-reports" },
          icon: FileText,
          show: hasRole("member-proprietor") || hasRole("member-admin") || canAccess("protection-list-report-view"),
        },
      ],
    },
    {
      name: "Financeiro",
      icon: CircleDollarSign,
      type: "financial",
      show: canAccess("access-to-finance"),
      children: [
        {
          name: "Gerir Setores",
          url: { name: "sectors" },
          icon: Briefcase,
          show: canAccess("access-to-finance"),
        },
        {
          name: "Gerir Custos",
          url: { name: "costs" },
          icon: Rows3,
          show: canAccess("access-to-finance"),
        },
        {
          name: "Entradas e Saídas",
          url: { name: "registers" },
          icon: DollarSignIcon,
          show: canAccess("access-to-finance"),
        },
      ],
    },
  ];
});

// Methods
const getLogoSrc = (isDarkMode: boolean, isSidebarExpanded: boolean) => {
  const logos = isDarkMode ? DARK_LOGOS : LIGHT_LOGOS;
  return isSidebarExpanded ? logos.full : logos.square;
};

const hasPermission = (permissionName: string) => {
  return !!authStore.user?.roles.some((role: any) =>
    role.permissions.some((permission: any) => {
      return permission.name === permissionName;
    })
  );
};
const hasRole = (roleName: string): Boolean => {
  return (
    authStore.user?.roles?.some((role: any) => role.name === roleName) ?? false
  );
};

const hasPermissionInActiveProject = (permissionName: string) => {
  return !!authStore.user?.roles
    .filter(
      (role: any) =>
        activeGroupProject.value &&
        role.pivot.project_id === activeGroupProject.value.project_id!
    )
    .some((role: any) =>
      role.permissions.some(
        (permission: any) => permission.name === permissionName
      )
    );
};

const canAccess = (permissionName: string) => {
  return (
    hasPermission(permissionName) ||
    hasPermissionInActiveProject(permissionName) ||
    hasRole(permissionName)
  );
};

const setActiveGroupProject = async (project: any) => {
  sidebarExpanded.value = false;
  configStore.loading = true;

  await workspaceStore.setActiveGroupProject(project);

  setTimeout(() => {
    configStore.loading = false;
    const isMobile = window.innerWidth < 768;
    sidebarExpanded.value = !isMobile;
    document.body.style.overflow = "";
  }, 2000);
};

const logout = async () => {
  await authStore.logout();
  router.push("/login");
};

const toggleCollapsed = (type: string) => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    if (type !== "") {
      collapsed.value = collapsed.value === type ? "" : type;
    } else {
      sidebarExpanded.value = false;
    }
    return;
  }

  if (!sidebarExpanded.value) {
    if (type !== "") {
      sidebarExpanded.value = true;
    }
  }

  collapsed.value = collapsed.value === type ? "" : type;
};

const handleSidebarExpand = (value: boolean) => {
  sidebarExpanded.value = value;
};

const toggleSidebar = () => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    sidebarExpanded.value = !sidebarExpanded.value;
  } else {
    router.push({ name: "home" });
  }
};

// Hooks
watch(
  () => route.matched,
  (matchedRoutes) => {
    matchedRoutes.forEach((matchedRoute) => {
      navMenu.value.forEach((group) => {
        if (group.children && group.type === matchedRoute.path.split("/")[1]) {
          collapsed.value = group.type;
        }
      });
    });
  },
  { immediate: true, deep: true }
);

watch(
  activeGroupProject,
  async () => {
    if (activeGroupProject.value) {
      const is = authStore.user?.roles
        .filter(
          (role: any) =>
            role.pivot.project_id === activeGroupProject.value?.project_id
        )
        .some(
          (role: any) =>
            route.meta.permissions?.includes?.(
              role.permissions.map((p: any) => p.name)
            ) ?? true
        );

      const hasAccess = authStore.user?.access_type === "member" || is;

      if (!hasAccess) await router.push({ name: "home" });
    }
  },
  { immediate: true }
);
</script>
