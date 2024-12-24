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
  LogOut,
  Package2,
  ChevronsUpDown,
} from "lucide-vue-next";

import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

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
      name: "home",
      title: "Home",
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
      name: "Relatórios",
      url: { name: "analytics" },
      icon: LineChart,
      show: true,
    },
    {
      name: "Projetos",
      url: { name: "projects" },
      icon: Building2,
      show: authStore.user?.type === "member",
    },
    {
      name: "Usuários",
      url: { name: "users" },
      icon: Users2,
      show: authStore.user?.type === "member",
    },
  ];

  return menu.filter((item) => item.show);
});

// Times (Projects)
const projects = computed(() => workspaceStore.projects);
const activeProject = computed(() => workspaceStore.activeProject || null);

const workspaceStore = useWorkspaceStore();

const setActiveProject = async (
  project: typeof workspaceStore.activeProject
) => {
  await workspaceStore.setActiveProject(project);
};

const stateResponsive = ref(false);
const setResponsive = () => {
  stateResponsive.value = !stateResponsive.value;
};

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
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader v-if="activeProject">
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
                    <component
                      v-if="activeProject && activeProject.media.length"
                      :is="activeProject.media[0]"
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
                    <component
                      v-if="project && project.media.length"
                      :is="project.media[0]"
                      class="size-4 shrink-0"
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
            <SidebarMenuItem v-for="item in navMenu" :key="item.name">
              <TooltipProvider :disabled="!stateResponsive">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton as-child>
                      <router-link
                        :to="item.url"
                        class="flex items-center p-2 rounded-md transition-colors"
                        :class="{
                          'bg-sidebar-accent text-sidebar-accent-foreground':
                            route.name === item.url.name,
                          'hover:bg-sidebar-hover hover:text-sidebar-hover-foreground': true,
                        }"
                      >
                        <component :is="item.icon" class="mr-2" />
                        <span>{{ item.name }}</span>
                      </router-link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">{{ item.name }}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SidebarMenuItem>
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
        <router-view></router-view>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
