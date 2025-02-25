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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
  Wrench,
  FolderDot,
  ChevronRight,
  SquareStack,
  CircleDollarSign,
  ExternalLink,
  Sun,
  Moon, Briefcase, DollarSign, DollarSignIcon,
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
import { Switch } from "@/components/ui/switch";
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

const navMenu = computed(() => {
  const menu = [
    {
      name: "Home",
      url: { name: "home" },
      icon: Home,
      show: true,
    },
    {
      name: "Métricas",
      url: { name: "analytics" },
      icon: LineChart,
      show: true,
      type: "report",
    },
    {
      name: "SMS Funnel",
      url: { name: "sms-funnel" },
      icon: Send,
      show: true,
      type: "report",
    },
    {
      name: "Google Analytics",
      url: { name: "google-analytics" },
      icon: ChartNoAxesCombined,
      show: true,
      type: "report",
    },
    {
      name: "Active Campaign",
      url: { name: "active-campaign" },
      icon: MailCheck,
      show: true,
      type: "report",
    },
    {
      name: "Projetos",
      url: { name: "projects" },
      icon: Building2,
      show: authStore.user?.access_type === "member",
      type: "management",
    },
    {
      name: "Usuários",
      url: { name: "users" },
      icon: Users2,
      show: authStore.user?.access_type === "member",
      type: "management",
    },
    {
      name: "Textos Motivacionais",
      url: { name: "texts" },
      icon: Album,
      show: authStore.user?.access_type === "member",
      type: "management",
    },
    {
      name: "Financeiro",
      url: { name: "financial" },
      icon: CircleDollarSign,
      show: true,
      type: "report",
    },

    {
      name: "Setor",
      url: {name: "sector"},
      icon: Briefcase,
      show: authStore.user?.access_type === "member",
      type: "management",
    },

    {
      name: "Custo",
      url: {name: "cost"},
      icon: DollarSign,
      show: authStore.user?.access_type === "member",
      type: "management",
    },
    {
      name: "Financeiro",
      url: {name: "financialManager"},
      icon: DollarSignIcon,
      show: authStore.user?.access_type === "member",
      type: "management",
    },
    {
      name: "Jogadores",
      url: { name: "players" },
      icon: Users2,
      type: "management",
      show: true,
    },
    {
      name: "Rastreamento UTM",
      url: { name: "utm-tracks" },
      icon: ExternalLink,
      type: "management",
      show: true,
    },
    {
      name: "IA",
      url: { name: "ia" },
      icon: Bot,
      show: true,
      type: "utils",
    },

  ];

  return menu.filter((item) => item.show);
});

const navCategory = computed(() => {
  const category = [
    {
      name: "Ferramentas",
      icon: Wrench,
      options: navMenu.value.filter((item) => item.type === "utils"),
    },
    {
      name: "Gerenciamento",
      icon: SquareStack,
      options: navMenu.value.filter((item) => item.type === "management"),
    },
    {
      name: "Relatórios",
      icon: FolderDot,
      options: navMenu.value.filter((item) => item.type === "report"),
    },
  ];
  return category;
});

const width = ref(0);
const height = ref(0);

const onResize = ({ width: newWidth, height: newHeight }) => {
  width.value = newWidth;
  height.value = newHeight;
};
// Times (Projects)
const workspaceStore = useWorkspaceStore();
const projects = computed(() => workspaceStore.projects);
const activeProject = computed(() => workspaceStore.activeProject || null);

import { useConfigStore } from "@/stores/config";
const configStore = useConfigStore();

const setActiveProject = async (
  project: typeof workspaceStore.activeProject
) => {
  configStore.setLoading(true);
  await workspaceStore.setActiveProject(project);
  setTimeout(() => configStore.setLoading(false), 2000);
};

const stateResponsive = ref(false);
const setResponsive = () => {
  stateResponsive.value = !stateResponsive.value;
};
const mode = useColorMode();
mode.value = localStorage.getItem("theme") || "auto";
onMounted(async () => {
  const user = authStore.user;
  if (user) {
    await workspaceStore.loadInitialData(user?.preferences, user?.projects);
  }
});

// Logout
const logout = async () => {
  authStore.logout();
  router.push("/login");
};

const logoSrc = computed(() => {
  return mode.value === "dark"
    ? "/logo-elevate-white.png"
    : "/logo-elevate-black.png";
});
</script>

<template>
  <CustomLoading v-if="configStore.loading"></CustomLoading>
  <SidebarProvider v-else>
    <Sidebar collapsible="icon">
      <SidebarHeader v-if="activeProject" v-resize="onResize">
        <router-link :to="{ name: 'home' }"
          ><img :src="logoSrc" alt="Logo" class="m-auto py-4 w-1/2"
        /></router-link>

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
                      v-if="activeProject && activeProject.logo_url"
                      :src="activeProject.logo_url"
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
                      activeProject.name
                    }}</span>
                    <span class="truncate text-xs">Projeto</span>
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
                  v-for="project in workspaceStore.projects"
                  :key="project.name"
                  class="gap-2 p-2"
                  @click="setActiveProject(project)"
                >
                  <div
                    class="flex size-6 items-center justify-center rounded-sm border"
                  >
                    <img
                      v-if="project && project.logo_url"
                      class="size-4 shrink-0"
                      :src="project.logo_url"
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
            <SidebarMenuItem>
              <TooltipProvider :disabled="!stateResponsive">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton as-child>
                      <router-link
                        :to="navMenu[0].url"
                        class="flex items-center p-2 rounded-md transition-colors"
                        :class="{
                          'bg-sidebar-accent text-sidebar-accent-foreground':
                            route.name === navMenu[0].url.name,
                          'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground': true,
                        }"
                      >
                        <component :is="navMenu[0].icon" />
                        <span>{{ navMenu[0].name }}</span>
                      </router-link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{{
                    navMenu[0].name
                  }}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
            <Collapsible
              v-for="item in navCategory"
              :key="item.name"
              as-child
              class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.name">
                    <component :is="item.icon" />
                    <span>{{ item.name }}</span>
                    <ChevronRight
                      class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem
                      v-for="subItem in item.options"
                      :key="subItem.name"
                    >
                      <SidebarMenuSubButton as-child>
                        <router-link
                          :to="subItem.url"
                          class="flex items-center p-2 rounded-md transition-colors"
                          :class="{
                            'bg-sidebar-accent text-sidebar-accent-foreground':
                              route.name === subItem.url.name,
                            'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground': true,
                          }"
                        >
                          <component :is="subItem.icon" class="mr-2" />
                          <span>{{ subItem.name }}</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
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
                      :src="authStore.user?.avatar"
                      :alt="authStore.user?.name"
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
          <SidebarTrigger @click="setResponsive()" class="-ml-1" />
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
      <main class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <div class="mx-auto w-full min-w-0">
          <router-view></router-view>
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
