<template>
  <SidebarProvider v-model="sidebarExpanded" >
    <Sidebar collapsible="icon" v-model="sidebarExpanded" :collapsed="sidebarExpanded">
      <SidebarHeader v-if="activeGroupProject">
        <router-link :to="{ name: 'home' }">
          <img
            :src="logoSrc"
            alt="Logo"
            :class="{
              'w-1/2 py-4': !sidebarExpanded,
              'w-6 py-1': sidebarExpanded,
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
                    <AvatarImage :src="authStore.user?.icon" />
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
          class="flex w-full h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 w-full px-4">
          <SidebarTrigger
              :toggle="toggleSidebar"
              class="-ml-1"
          />

          <Separator orientation="vertical" class="mr-2 h-4" />
          <Breadcrumb class="flex-1">
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
          <SidebarTrigger
              :toggle="toggleSidebarIA"
              class="-ml-1"
          />
        </div>
      </header>
      <CustomLoading v-if="configStore.loading" />
      <main v-else class="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
        <div class="mx-auto w-full min-w-0">
          <router-view></router-view>
        </div>
      </main>
    </SidebarInset>
    <Sidebar side="right" :collapsed="sidebarIaExpanded" v-model="sidebarIaExpanded" collapsible="offcanvas" >
      <SidebarHeader  class="p-4 max-h-64">
        <h1 class="font-bold">
          Elevate IA
        </h1>
        <div>
          <p class="text-[16px] py-4">
            Histórico
          </p>
          <div>
            <p class="border-b-2 text-[10px] truncate pb-2">Como fazer um bolo de laranja</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent class="p-4 ">
        <Card class="h-full w-full  p-2 bg-[#1c1c1c]">
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto" ref="messageContainerRef">
              <div v-for="message in messages" :key="message.id" class="mb-4">
                <div>
                  <div  class="space-x-2 pb-2" :class="(message.sender === 'user' ? 'flex justify-end' : 'flex justify-start')">
                    <Avatar class="h-4 w-4 rounded-lg">
                      <AvatarImage :src="authStore.user?.icon" />
                      <AvatarFallback class="rounded-lg">
                        {{ authStore.user?.initials }}
                      </AvatarFallback>
                    </Avatar>
                    <p class="text-[10px]">{{message.sender === 'user'? 'Você':'I.A'}}</p>
                  </div>
                  <p class="text-[12px]" :class="(message.sender === 'user' ? 'flex text-end' : 'flex text-start')">{{ message.content }}</p>
                  <div v-if="message.file" class="mt-2">
                    <a :href="message.file" target="_blank" class="text-blue-500 hover:underline">
                      {{ extractFileName(message.file) }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </SidebarContent>
      <SidebarFooter  class="p-4  grid grid-cols-1 gap-2">
        <Textarea placeholder="Digite aqui..."  />
        <Button class="bg-yellow-300">
          Enviar
        </Button>
        <Button variant="ghost">
          <Paperclip /> Anexar arquivo
        </Button>
        <p class="text-[8px]">
          As respostas podem mostrar informações imprecisas qualquer duvida entre em contato conosco.
        </p>
      </SidebarFooter>
    </Sidebar>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { Paperclip } from 'lucide-vue-next';
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
  ListFilter,
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
  MessageCircle,
  Rows3,
  ChevronRight,
  SquareStack,
  CircleDollarSign,
  ExternalLink,
  Briefcase,
  DollarSignIcon,
  Blocks,
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
const workspaceStore = useWorkspaceStore();
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);
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
    show:
      (authStore.user?.access_type === "member" &&
        authStore.user?.roles.some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-dashboard"
          )
        )) ||
      authStore.user?.roles
        .filter(
          (role) =>
            activeGroupProject.value &&
            role.pivot.project_id === activeGroupProject.value.project_id
        )
        .some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-dashboard"
          )
        ),
  },
  {
    name: "Elevate IA",
    icon: Bot,
    type: "ia",
    show:
      (authStore.user?.access_type === "member" &&
        authStore.user?.roles.some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-ai"
          )
        )) ||
      authStore.user?.roles
        .filter(
          (role) =>
            activeGroupProject.value &&
            role.pivot.project_id === activeGroupProject.value.project_id
        )
        .some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-ai"
          )
        ),
    children: [
      {
        name: "Chat",
        url: { name: "chat" },
        icon: MessageCircle,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-ai"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-ai"
              )
            ),
      },
      {
        name: "Jarbas BOT",
        url: { name: "jarbas-bot" },
        icon: Bot,
        show:
          (activeGroupProject.value &&
            activeGroupProject.value.type === "project" &&
            authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-ai"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-ai"
              )
            ),
      },
    ],
  },
  {
    name: "Controles",
    icon: SlidersHorizontal,
    type: "controls",
    show:
      (authStore.user?.access_type === "member" &&
        authStore.user?.roles.some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-reports"
          )
        )) ||
      authStore.user?.roles
        .filter(
          (role) =>
            activeGroupProject.value &&
            role.pivot.project_id === activeGroupProject.value.project_id
        )
        .some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-reports"
          )
        ),
    children: [
      {
        name: "Performance",
        url: { name: "performances" },
        icon: LineChart,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            ),
      },
      {
        name: "Tráfego",
        url: { name: "traffics" },
        icon: ChartNoAxesCombined,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            ),
      },
      {
        name: "E-mails",
        url: { name: "emails" },
        icon: MailCheck,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            ),
      },
      {
        name: "SMS Insights",
        url: { name: "sms-insights" },
        icon: Send,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-reports"
              )
            ),
      },
    ],
  },
  {
    name: "Gerenciamento",
    icon: SquareStack,
    type: "manage",
    show:
      (authStore.user?.access_type === "member" &&
        authStore.user?.roles.some((role) =>
          role.permissions.some(
            (permission) =>
              permission.name === "access-to-client-management" ||
              permission.name === "access-to-member-management"
          )
        )) ||
      authStore.user?.roles
        .filter(
          (role) =>
            activeGroupProject.value &&
            role.pivot.project_id === activeGroupProject.value.project_id
        )
        .some((role) =>
          role.permissions.some(
            (permission) =>
              permission.name === "access-to-client-management" ||
              permission.name === "access-to-member-management"
          )
        ),
    children: [
      {
        name: "Projetos",
        url: { name: "projects" },
        icon: Building2,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-project-groups"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-project-groups"
              )
            ),
      },
      {
        name: "Usuários",
        url: { name: "users" },
        icon: Users2,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-users"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-users"
              )
            ),
      },
      {
        name: "Perfis",
        url: { name: "roles" },
        icon: UserCog,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-permissions"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-permissions"
              )
            ),
      },
      {
        name: "MyElevate Insights",
        url: { name: "texts" },
        icon: Album,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) =>
                  permission.name === "access-to-motivational-texts"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) =>
                  permission.name === "access-to-motivational-texts"
              )
            ),
      },
      {
        name: "Segmentos",
        url: { name: "segments" },
        icon: ListFilter,
        show:
          (activeGroupProject.value &&
            activeGroupProject.value.type === "project" &&
            authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "view-segments"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "view-segments"
              )
            ),
      },
      {
        name: "Jogadores",
        url: { name: "players" },
        icon: Users2,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "player-registrations"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "player-registrations"
              )
            ),
      },
      {
        name: "Rastreamento UTM",
        url: { name: "utm-tracks" },
        icon: ExternalLink,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) =>
                  permission.name === "access-to-parameter-tracking"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) =>
                  permission.name === "access-to-parameter-tracking"
              )
            ),
      },
      {
        name: "Integrações",
        url: { name: "integrations" },
        icon: Blocks,
        show:
          activeGroupProject.value &&
          activeGroupProject.value.type === "project" &&
          ((authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-integrations"
              )
            )) ||
            authStore.user?.roles
              .filter(
                (role) =>
                  activeGroupProject.value &&
                  role.pivot.project_id === activeGroupProject.value.project_id
              )
              .some((role) =>
                role.permissions.some(
                  (permission) => permission.name === "access-to-integrations"
                )
              )),
      },
    ],
  },
  {
    name: "Financeiro",
    icon: CircleDollarSign,
    type: "financial",
    show:
      (authStore.user?.access_type === "member" &&
        authStore.user?.roles.some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-finance"
          )
        )) ||
      authStore.user?.roles
        .filter(
          (role) =>
            activeGroupProject.value &&
            role.pivot.project_id === activeGroupProject.value.project_id
        )
        .some((role) =>
          role.permissions.some(
            (permission) => permission.name === "access-to-finance"
          )
        ),
    children: [
      {
        name: "Gerir Setores",
        url: { name: "sectors" },
        icon: Briefcase,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            ),
      },
      {
        name: "Gerir Custos",
        url: { name: "costs" },
        icon: Rows3,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            ),
      },
      {
        name: "Entradas e Saídas",
        url: { name: "registers" },
        icon: DollarSignIcon,
        show:
          (authStore.user?.access_type === "member" &&
            authStore.user?.roles.some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            )) ||
          authStore.user?.roles
            .filter(
              (role) =>
                activeGroupProject.value &&
                role.pivot.project_id === activeGroupProject.value.project_id
            )
            .some((role) =>
              role.permissions.some(
                (permission) => permission.name === "access-to-finance"
              )
            ),
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

import { useConfigStore } from "@/stores/config";
import { Separator } from "@/components/ui/separator";
import {Card} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import ElevateAI from "@/components/layout/ElevateAI.vue";
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

watch(
  activeGroupProject,
  async () => {
    if (activeGroupProject.value) {
      const hasAccess =
        authStore.user?.access_type === "member" ||
        authStore.user?.roles
          .filter(
            (role) =>
              activeGroupProject.value &&
              role.pivot.project_id === activeGroupProject.value.project_id
          )
          .some((role) =>
            role.permissions.some((permission) =>
              route.meta.permissions
                ? route.meta.permissions.includes(permission.name)
                : true
            )
          );
      if (!hasAccess) {
        await router.push({ name: "home" });
      }
    }
  },
  { immediate: true }
);
// Sidebar state
const sidebarExpanded = ref(true);
const sidebarIaExpanded = ref(true);
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
      ? "/logo-elevate-square-white.png"
      : "/logo-elevate-white.png"
    : sidebarExpanded.value
      ? "/logo-elevate-square-black.png"
      : "/logo-elevate-black.png";
});

const handleMenuItemClick = () => {
  if (window.innerWidth < 768) {
    sidebarExpanded.value = true;
  }
};

const toggleCollapsed = (type: string) => {
  console.log(sidebarExpanded,type)
  if (sidebarExpanded.value) {
    collapsed.value = type;
    sidebarExpanded.value = true;

  } else {
    collapsed.value = collapsed.value === type ? "" : type;
  }
};


const toggleSidebar = () => {
  setResponsive()
  if (window.innerWidth < 768) {
    sidebarExpanded.value = true;
    return
  }
  sidebarExpanded.value = !sidebarExpanded.value;
};
const toggleSidebarIA = () => {
  setResponsive()
  if (window.innerWidth < 768) {
    sidebarIaExpanded.value = true;
    return
  }
  sidebarIaExpanded.value = !sidebarIaExpanded.value;
};
</script>
