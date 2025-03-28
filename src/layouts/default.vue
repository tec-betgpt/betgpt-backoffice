<template>
  <SidebarProvider v-model:open="sidebarExpanded">
    <Sidebar collapsible="icon" :collapsed="sidebarExpanded">
      <SidebarHeader v-if="activeGroupProject">
        <router-link :to="{ name: 'home' }">
          <img
            :src="logoSrc"
            alt="Logo"
            :class="{
              'w-1/2 py-4': sidebarExpanded,
              'w-6 py-1': !sidebarExpanded,
            }"
            class="m-auto transition-transform duration-200 ease-linear hover:scale-105"
          />
        </router-link>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div
                    class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                  >
                    <img
                      v-if="activeGroupProject && activeGroupProject.logo"
                      :src="activeGroupProject.logo"
                      alt="Imagem do projeto"
                      class="size-4"
                    />

                    <Package2
                      class="h-4 w-4 transition-all group-hover:scale-110"
                      v-else
                    />
                  </div>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      activeGroupProject.name
                    }}</span>
                    <span class="truncate text-xs">{{
                      $t(activeGroupProject.type)
                    }}</span>
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
                    <img
                      v-if="project && project.logo"
                      class="size-4 shrink-0"
                      :src="project.logo"
                      alt="Imagem do projeto"
                    />
                    <Package2
                      class="h-4 w-4 transition-all group-hover:scale-110"
                      v-else
                    />
                  </div>
                  {{ project.name }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Projeto</SidebarGroupLabel>
          <SidebarMenu>
            <template v-for="item in navMenu" :key="item.name">
              <SidebarMenuItem v-if="!item.children && item.show">
                <TooltipProvider :disabled="!stateResponsive">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <SidebarMenuButton
                        as-child
                        :is-active="route.name === item.url.name"
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
                v-else
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar class="h-8 w-8 rounded-lg">
                    <AvatarImage
                      v-if="
                        authStore.user &&
                        authStore.user.media &&
                        authStore.user.media.length
                      "
                      :src="authStore.user?.media[0].original_url"
                    />
                    <AvatarFallback class="rounded-lg">
                      {{ authStore.user?.initials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{
                      authStore.user?.first_name
                    }}</span>
                    <span class="truncate text-xs">{{
                      authStore.user?.email
                    }}</span>
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
                <DropdownMenuLabel class="p-0 font-normal">
                  <div
                    class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                  >
                    <Avatar class="h-8 w-8 rounded-lg">
                      <AvatarImage
                        :src="authStore.user?.avatar"
                        :alt="authStore.user?.name"
                      />
                      <AvatarFallback class="rounded-lg">
                        {{ authStore.user?.initials }}
                      </AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{
                        authStore.user?.name
                      }}</span>
                      <span class="truncate text-xs">{{
                        authStore.user?.email
                      }}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  ><router-link :to="{ name: 'configurations.profile' }"
                    >Configurações</router-link
                  ></DropdownMenuItem
                >
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="logout">
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger
            @click="setResponsive()"
            :toggle="handleMenuItemClick"
            class="-ml-1"
          />
          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
              >
                <template v-if="crumb.path">
                  <BreadcrumbLink as-child>
                    <router-link :to="{ path: crumb.path }">
                      {{ crumb.title }}
                    </router-link>
                  </BreadcrumbLink>
                </template>
                <template v-else>
                  <BreadcrumbPage>{{ crumb.title }}</BreadcrumbPage>
                </template>
                <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1" />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <CustomLoading v-if="configStore.loading" />
      <main v-else class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <div class="mx-auto w-full min-w-0">
          <router-view></router-view>
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  SidebarTrigger,
  SidebarHeader,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarProvider,
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
  Users2,
  Bot,
  LogOut,
  Package2,
  ChevronsUpDown,
  Send,
  ChartNoAxesCombined,
  MailCheck,
  Album,
  SlidersHorizontal,
  Rows3,
  ChevronRight,
  SquareStack,
  CircleDollarSign,
  ExternalLink,
  Briefcase,
  DollarSignIcon,
  UserCog,
} from "lucide-vue-next";
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useColorMode } from "@vueuse/core";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import { resizeDirective as vResize } from "v-resize-observer";
interface BreadcrumbItem {
  name: string;
  title: string;
  path: string | null;
}
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
// Breadcrumbs
const breadcrumbs = computed(() => {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      name: "Elevate",
      title: "Elevate",
      path: "/home",
    },
  ];

  route.matched.forEach((routeRecord, index) => {
    const name = routeRecord.name as string;
    const title = routeRecord.meta.title as string;

    if (index === route.matched.length - 1) {
      breadcrumbItems.push({
        name,
        title,
        path: null,
      });
    } else {
      breadcrumbItems.push({
        name,
        title,
        path: routeRecord.path,
      });
    }
  });

  return breadcrumbItems;
});

const navMenu = computed(() => [
  {
    name: "Home",
    url: { name: "home" },
    icon: Home,
    show: true,
  },
  {
    name: "Elevate IA",
    url: { name: "ia" },
    icon: Bot,
    show: true,
  },
  {
    name: "Controles",
    icon: SlidersHorizontal,
    show: true,
    type: "controls",
    children: [
      {
        name: "Performance",
        url: { name: "performances" },
        icon: LineChart,
        show: true,
      },
      {
        name: "Tráfego",
        url: { name: "traffics" },
        icon: ChartNoAxesCombined,
        show: true,
      },
      {
        name: "E-mails",
        url: { name: "emails" },
        icon: MailCheck,
        show: true,
      },
      {
        name: "SMS Insights",
        url: { name: "sms-insights" },
        icon: Send,
        show: true,
      },
    ],
  },
  {
    name: "Gerenciamento",
    icon: SquareStack,
    show: true,
    type: "manage",
    children: [
      {
        name: "Projetos",
        url: { name: "projects" },
        icon: Building2,
        show: authStore.user?.access_type === "member",
      },
      {
        name: "Usuários",
        url: { name: "users" },
        icon: Users2,
        show: authStore.user?.access_type === "member",
      },
      {
        name: "Perfis",
        url: { name: "roles" },
        icon: UserCog,
        show: authStore.user?.access_type === "member",
      },
      {
        name: "MyElevate Insights",
        url: { name: "texts" },
        icon: Album,
        show: authStore.user?.access_type === "member",
      },
      {
        name: "Jogadores",
        url: { name: "players" },
        icon: Users2,
        show: true,
      },
      {
        name: "Rastreamento UTM",
        url: { name: "utm-tracks" },
        icon: ExternalLink,
        show: true,
      },
    ],
  },
  {
    name: "Financeiro",
    icon: CircleDollarSign,
    show: true,
    type: "financial",
    children: [
      {
        name: "Gerir Setores",
        url: { name: "sectors" },
        icon: Briefcase,
        show: true,
      },

      {
        name: "Gerir Custos",
        url: { name: "costs" },
        icon: Rows3,
        show: true,
      },
      {
        name: "Entradas e Saídas",
        url: { name: "registers" },
        icon: DollarSignIcon,
        show: true,
      },
    ],
  },
]);

watch(
  () => route.matched,
  (matchedRoutes) => {
    matchedRoutes.forEach((matchedRoute) => {
      navMenu.value.forEach((group) => {
        if (group.children) {
          if (group.type === matchedRoute.path.split("/")[1]) {
            collapsed.value = group.type;
          }
        }
      });
    });
  },
  { immediate: true, deep: true }
);
const collapsed = ref("");
// Times (Projects)
const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

import { useConfigStore } from "@/stores/config";
import { Separator } from "@/components/ui/separator";
const configStore = useConfigStore();

const setActiveGroupProject = async (
  project: typeof workspaceStore.activeGroupProject
) => {
  sidebarExpanded.value = false;
  configStore.setLoading(true);
  await workspaceStore.setActiveGroupProject(project);

  setTimeout(() => {
    configStore.setLoading(false);
    sidebarExpanded.value = true;
    document.body.style.overflow = "";
  }, 2000);
};

// Sidebar state
const sidebarExpanded = ref(true);
const stateResponsive = ref(false);
const setResponsive = () => {
  stateResponsive.value = !stateResponsive.value;
};

const mode = useColorMode();
//@ts-ignore
mode.value = localStorage.getItem("theme") || "auto";
onMounted(async () => {
  const user = authStore.user;
  if (user) {
    await workspaceStore.loadInitialData(
      user?.preferences,
      user?.group_projects
    );
  }
});

// Logout
const logout = async () => {
  await authStore.logout();
  router.push("/login");
};

const logoSrc = computed(() => {
  return mode.value === "dark"
    ? sidebarExpanded.value
      ? "/logo-elevate-white.png"
      : "/logo-elevate-square-white.png"
    : sidebarExpanded.value
    ? "/logo-elevate-black.png"
    : "/logo-elevate-square-black.png";
});

const handleMenuItemClick = () => {
  if (window.innerWidth < 768) {
    sidebarExpanded.value = true;
  }
};

const toggleCollapsed = (type: string) => {
  if (!sidebarExpanded.value) {
    collapsed.value = type;
    sidebarExpanded.value = true;
  } else {
    collapsed.value = collapsed.value === type ? "" : type;
  }
};
</script>
