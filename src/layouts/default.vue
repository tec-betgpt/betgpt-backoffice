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
              :logo="true"
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

              :logo="false"
              :toggle="toggleSidebarIA"
              class="-ml-1"
          />
        </div>
      </header>
      <CustomLoading v-if="configStore.loading" />
      <main
        v-else
        class="grid flex-1 items-start gap-4 p-4 pt-0 sm:px-6 sm:py-0"
      >
        <div class="mx-auto w-full min-w-0">
          <router-view></router-view>
        </div>
      </main>
    </SidebarInset>
    <Sidebar side="right" :collapsed="sidebarIaExpanded" v-model="sidebarIaExpanded" variant="sidebar" collapsible="offcanvas" >
      <SidebarHeader  class="p-4 max-h-64">
        <h1 class="font-bold">
          Elevate IA
        </h1>
        <div>
          <p class="text-[16px] py-4">
            Histórico
          </p>
          <div class="max-h-20 overflow-scroll">
            <p v-for="chat in chats" :key="chat.id" @click="selectChat(chat.id)" class="border-b-2 text-[10px] cursor-pointer truncate py-2">{{chat.title}}</p>

          </div>
        </div>
      </SidebarHeader>
      <SidebarContent class="p-4 ">
        <Card class="h-full w-full  p-2" :ref="messageContainerRef">
          <div class="flex flex-col h-full">
            <div class="flex-1 overflow-y-auto" ref="messageContainerRef">
              <div v-for="message in messages" :key="message.id" class="mb-4">
                <div>
                  <div  class="space-x-2 pb-2" :class="(message.sender === 'user' ? 'flex justify-end' : 'flex justify-start')">
                    <Avatar class="h-4 w-4 rounded-lg">
                      <AvatarImage :src="message.sender === 'user'? this.authStore.user?.icon:iconIa" />
                      <AvatarFallback class="rounded-lg">
                        {{ authStore.user?.initials }}
                      </AvatarFallback>
                    </Avatar>
                    <p class="text-[10px]">{{message.sender === 'user'? 'Você':'I.A'}}</p>
                  </div>
                  <p class="text-[12px] w-full " :class="(message.sender === 'user' ? 'flex text-end justify-end' : 'flex text-start justify-start')" v-html="message.content"/>
                  <div v-if="message.file" class="mt-2">
                    <a :href="message.file" target="_blank" class="text-blue-500 hover:underline">
                      {{ extractFileName(message.file) }}
                    </a>
                  </div>
                </div>
              </div>
              <div
                  v-if="uploadedFilePath"
                  class="flex justify-end w-full items-center"
              >
                <Badge
                    class="max-w-[80%] lg:max-w-[60%] shadow-md transition-all flex items-start px-3 py-2"
                >
                  <div>
                    <div
                        v-if="
                      uploadedFilePath.endsWith('.jpg') ||
                      uploadedFilePath.endsWith('.jpeg') ||
                      uploadedFilePath.endsWith('.png') ||
                      uploadedFilePath.endsWith('.gif')
                    "
                    >
                      <img
                          :src="uploadedFilePath"
                          alt="Pré-visualização da Imagem"
                          class="max-h-32 max-w-full object-cover my-2"
                      />
                    </div>
                    <div v-else-if="uploadedFilePath.endsWith('.pdf')">
                      <iframe :src="uploadedFilePath" class="w-full" />
                    </div>
                    <div v-else-if="uploadedFilePath.endsWith('.txt')">
                      <p>Arquivo de Texto anexado</p>
                    </div>
                    <div v-else>
                      <p>Arquivo anexado</p>
                    </div>
                    <Progress v-if="uploadProgress>0" v-model="uploadProgress"/>
                  </div>
                </Badge>
              </div>
              <div v-if="loading" class="flex flex-col gap-2">
                <Skeleton class="w-12 h-3"/>
                <Skeleton class="w-full h-3"/>
                <Skeleton class="w-full h-3"/>
              </div>
            </div>
          </div>
        </Card>
      </SidebarContent>
      <SidebarFooter  class="p-4  grid grid-cols-1 gap-2">
        <Textarea placeholder="Digite aqui..." @keyup.enter="sendMessage" v-model="newMessage"  />
        <Button class="bg-yellow-300" @click="sendMessage">
          Enviar
        </Button>
        <Label for="file" :ref="fileInputRef" class="flex w-full justify-center border p-2 rounded-sm items-center gap-2 cursor-pointer" >
          <Paperclip /> Anexar arquivo
        </Label>
        <Input id="file" type="file" class="hidden" @change="handleFileUpload"/>
        <p class="text-[8px]">
          As respostas podem mostrar informações imprecisas qualquer duvida entre em contato conosco.
        </p>
      </SidebarFooter>
    </Sidebar>
  </SidebarProvider>
</template>

<script lang="ts">
import {Paperclip, X} from 'lucide-vue-next';
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
  View,
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
import { useColorMode } from "@vueuse/core";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import { resizeDirective as vResize } from "v-resize-observer";
import { useConfigStore } from "@/stores/config";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {useWorkspaceStore} from "@/stores/workspace";
import {useAuthStore} from "@/stores/auth";
import {useRoute, useRouter} from "vue-router";
import axios from "axios";
import {Skeleton} from "@/components/ui/skeleton";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {marked} from "marked";


interface BreadcrumbItem {
  name: string;
  title: string;
  path: string | null;
}
interface Chat {
  id: number;
  title: string;
}
interface Message {
  id: number;
  sender: "user" | "assistant";
  content: string;
  iaModel: string;
  file: string | null;
  createdAt: string;
  updatedAt: string;
}
export default {
  name: 'DefaultLayout',
  components: {
    Progress,
    Badge, X,
    Label,
    Skeleton,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
    Paperclip,
    Avatar,
    AvatarFallback,
    AvatarImage,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    CustomLoading,
    Card,
    Input,
    Textarea,
    Separator,
    ChevronRight,
    LogOut,
    Package2,
    ChevronsUpDown,
  },

  data() {
    return {
      collapsed: "",
      sidebarExpanded: true,
      sidebarIaExpanded: true,
      stateResponsive: false,
      mode: useColorMode(),
      workspaceStore: useWorkspaceStore(),
      authStore: useAuthStore(),
      configStore: useConfigStore(),
      route: useRoute(),
      router: useRouter(),
      chats: [] as Chat[],
      selectedChatId: undefined,
      selectedModel: "openai",
      messages: [] as Message[],
      newMessage: "",
      uploadProgress: 0,
      file: null,
      loading: false,
      showNewChatModal: false,
      newChatTitle: "",
      uploadedFilePath: undefined,
      fileInputRef: undefined,
      messageContainerRef: undefined,
    };
  },

  computed: {
    activeGroupProject() {
      return  this.workspaceStore.activeGroupProject || null;
    },

    breadcrumbs() {
      const breadcrumbItems: BreadcrumbItem[] = [
        {
          name: "Elevate",
          title: "Elevate",
          path: "/home",
        },
      ];

      this.$route.matched.forEach((routeRecord, index) => {
        const name = routeRecord.name as string;
        const title = routeRecord.meta.title as string;

        if (index === this.$route.matched.length - 1) {
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
    },

    navMenu() {
     
      return  [
        {
          name: "Home",
          url: { name: "home" },
          icon: Home,
          show:
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-dashboard"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                         this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
                  )
                  .some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-dashboard"
                      )
                  ),
        },
        {
          name: "Jarbas BOT",
          icon: Bot,
          url: {name: "jarbas-bot"},
          type: "ia",
          show:
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-ai"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                          this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
                  )
                  .some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-ai"
                      )
                  ),
          // children: [
          //   {
          //     name: "Chat",
          //     url: { name: "chat" },
          //     icon: MessageCircle,
          //     show:
          //         (this.authStore.user?.access_type === "member" &&
          //             this.authStore.user?.roles.some((role) =>
          //                 role.permissions.some(
          //                     (permission) => permission.name === "access-to-ai"
          //                 )
          //             )) ||
          //         this.authStore.user?.roles
          //             .filter(
          //                 (role) =>
          //                     this.activeGroupProject &&
          //                     role.pivot.project_id === this.activeGroupProject.project_id
          //             )
          //             .some((role) =>
          //                 role.permissions.some(
          //                     (permission) => permission.name === "access-to-ai"
          //                 )
          //             ),
          //   },
          //   {
          //     name: "Jarbas BOT",
          //     url: { name: "jarbas-bot" },
          //     icon: Bot,
          //     show:
          //         (this.activeGroupProject &&
          //             this.activeGroupProject.type === "project" &&
          //             this.authStore.user?.access_type === "member" &&
          //             this.authStore.user?.roles.some((role) =>
          //                 role.permissions.some(
          //                     (permission) => permission.name === "access-to-ai"
          //                 )
          //             )) ||
          //         this.authStore.user?.roles
          //             .filter(
          //                 (role) =>
          //                     this.activeGroupProject &&
          //                     role.pivot.project_id === this.activeGroupProject.project_id
          //             )
          //             .some((role) =>
          //                 role.permissions.some(
          //                     (permission) => permission.name === "access-to-ai"
          //                 )
          //             ),
          //   },
          // ],
        },
        {
          name: "Audiências",
          icon: View,
          type: "audiences",
          show:
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-reports"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                          this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
                  )
                  .some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-reports"
                      )
                  ),
          children: [
            {
              name: "Clientes",
              url: { name: "clients" },
              icon: Users2,
              show:
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "player-registrations"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
                      )
                      .some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "player-registrations"
                          )
                      ),
            },
            {
              name: "Segmentos",
              url: { name: "segments" },
              icon: ListFilter,
              show:
                  (this.activeGroupProject &&
                      this.activeGroupProject.type === "project" &&
                      this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "view-segments"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
                      )
                      .some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "view-segments"
                          )
                      ),
            },
            {
              name: "Atribuições",
              url: { name: "attributions" },
              icon: ExternalLink,
              show:
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) =>
                                  permission.name === "access-to-parameter-tracking"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
                      )
                      .some((role) =>
                          role.permissions.some(
                              (permission) =>
                                  permission.name === "access-to-parameter-tracking"
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
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-reports"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                          this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-reports"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-reports"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-reports"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-reports"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) =>
                              permission.name === "access-to-client-management" ||
                              permission.name === "access-to-member-management"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                          this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-project-groups"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-users"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-permissions"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) =>
                                  permission.name === "access-to-motivational-texts"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
                      )
                      .some((role) =>
                          role.permissions.some(
                              (permission) =>
                                  permission.name === "access-to-motivational-texts"
                          )
                      ),
            },
            {
              name: "Integrações",
              url: { name: "integrations" },
              icon: Blocks,
              show:
                  this.activeGroupProject &&
                  this.activeGroupProject.type === "project" &&
                  ((this.authStore.user?.access_type === "member" &&
                          this.authStore.user?.roles.some((role) =>
                              role.permissions.some(
                                  (permission) => permission.name === "access-to-integrations"
                              )
                          )) ||
                      this.authStore.user?.roles
                          .filter(
                              (role) =>
                                  this.activeGroupProject &&
                                  role.pivot.project_id === this.activeGroupProject.project_id
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
              (this.authStore.user?.access_type === "member" &&
                  this.authStore.user?.roles.some((role) =>
                      role.permissions.some(
                          (permission) => permission.name === "access-to-finance"
                      )
                  )) ||
              this.authStore.user?.roles
                  .filter(
                      (role) =>
                          this.activeGroupProject &&
                          role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-finance"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-finance"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
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
                  (this.authStore.user?.access_type === "member" &&
                      this.authStore.user?.roles.some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-finance"
                          )
                      )) ||
                  this.authStore.user?.roles
                      .filter(
                          (role) =>
                              this.activeGroupProject &&
                              role.pivot.project_id === this.activeGroupProject.project_id
                      )
                      .some((role) =>
                          role.permissions.some(
                              (permission) => permission.name === "access-to-finance"
                          )
                      ),
            },
          ],
        },
      ]
    },

    logoSrc() {
      return this.mode === "dark"
        ? this.sidebarExpanded
          ? "/logo-elevate-square-white.png"
          : "/logo-elevate-white.png"
        : this.sidebarExpanded
          ? "/logo-elevate-square-black.png"
          : "/logo-elevate-black.png";
    },
    iconIa(){
      return this.mode === "dark"
        ? "/logo-elevate-square-white.png" : "/logo-elevate-square-black.png"

    }
  },

  watch: {
    '$route.matched': {
      handler(matchedRoutes) {
        matchedRoutes.forEach((matchedRoute) => {
          this.navMenu.forEach((group) => {
            if (group.children) {
              if (group.type === matchedRoute.path.split("/")[1]) {
                this.collapsed = group.type;
              }
            }
          });
        });
      },
      immediate: true,
      deep: true
    },

    activeGroupProject: {

      async handler() {
        if (this.activeGroupProject) {
          const hasAccess =
            this.authStore.user?.access_type === "member" ||
            this.authStore.user?.roles
              .filter(
                (role) =>
                  this.activeGroupProject &&
                  role.pivot.project_id === this.activeGroupProject.project_id
              )
              .some((role) =>
                role.permissions.some((permission) =>
                  this.$route.meta.permissions
                    ? this.$route.meta.permissions.includes(permission.name)
                    : true
                )
              );
          if (!hasAccess) {
            await this.router.push({ name: "home" });
          }
        }
      },
      immediate: true
    }
  },

  async mounted() {
    this.mode = localStorage.getItem("theme") || "auto";
    const user = this.authStore.user;
    if (user) {
      await this.workspaceStore.loadInitialData(
          user?.preferences,
          user?.group_projects
      );
    }
    await this.loadChats()
  },

  methods: {
    setResponsive() {
      this.stateResponsive = !this.stateResponsive;
    },

    async setActiveGroupProject(project) {
      this.sidebarExpanded = false;
      this.configStore.loading = true;
      await this.workspaceStore.setActiveGroupProject(project);

      setTimeout(() => {
        this.configStore.loading = false
        this.sidebarExpanded = true;
        document.body.style.overflow = "";
      }, 2000);
    },

    async logout() {
      await this.authStore.logout();
      this.router.push("/login");
    },

    handleMenuItemClick() {
      if (window.innerWidth < 768) {
        this.sidebarExpanded = true;
      }
    },

    toggleCollapsed(type) {
      if (type!="") {
        this.collapsed = this.collapsed === type ? "" : type;
      } else {
        this.sidebarExpanded = false;
      }
    },

    toggleSidebar() {
      this.setResponsive();
      this.sidebarExpanded = !this.sidebarExpanded;
    },

    toggleSidebarIA() {
      this.setResponsive();
      this.sidebarIaExpanded = !this.sidebarIaExpanded;
    },


    async loadChats() {
      this.loading = true;
      try {
        const response = await axios.get(
            `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/list`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
        );
        this.chats = response.data.chats;
        // if (this.chats.length > 0 && !this.selectedChatId) {
        //   this.selectedChatId = this.chats[0].id.toString();
        //   await this.loadMessages();
        // }
      } catch (error) {
        console.error("Erro ao carregar chats:", error);
      } finally {
        this.loading = false;
      }
    },

    async createNewChat() {
    //  if (!this.newChatTitle) return;

      try {
        const response = await axios.post(
            `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/create`,
            { title: this.newMessage },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
        );

        this.chats.push(response.data.chat);
        this.selectedChatId = response.data.chat.id.toString();

        this.newChatTitle = "";
      } catch (error) {
        console.error("Erro ao criar chat:", error);
      } finally {
        this.showNewChatModal = false;
      }
    },

    async deleteChat(chatId: number) {
      if (!confirm("Tem certeza que deseja excluir este chat?")) return;
      try {
        await axios.delete(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${chatId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        this.chats = this.chats.filter((c) => c.id !== chatId);
        if (this.selectedChatId === chatId) {
          this.selectedChatId =
              this.chats.length > 0 ? this.chats[0].id.toString() : null;
        }
      } catch (error) {
        console.error("Erro ao excluir chat:", error);
      }
    },

    async selectChat(chatId: number) {
      this.selectedChatId = chatId;
      await this.loadMessages();
    },

    async loadMessages() {
      if (!this.selectedChatId) return;
      this.messages = [];

      this.loading = true;
      try {
        const response = await axios.get(
            `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/messages`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
        );

        this.messages = response.data.messages.map((message: any) => ({
          ...message,
          content: marked.parse(message.content),
        }));
        this.scrollToBottom();
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      } finally {
        this.loading = false;
      }
    },

    extractFileName(url: string): string {
      return url.split("/").pop() || "";
    },

    async sendMessage() {
      if (!this.newMessage && !this.uploadedFilePath) return;
      if (!this.selectedChatId !== undefined) {
        await this.createNewChat();
        this.loadChats()
      }
      else {
        console.log("Por favor, selecione um chat antes de enviar uma mensagem.");
        return;
      }
      const userMessage: any = {
        sender: "user",
        content: this.newMessage,
        iaModel: 'openai',
        file: this.uploadedFilePath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.loading = true;
      try {
        this.messages.push(userMessage);
        this.scrollToBottom();
        this.newMessage = "";
        this.uploadedFilePath = null;
        const response = await axios.post(
            `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/message`,
            userMessage,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
        );

        const assistantMessage: any = {
          sender: "assistant",
          content: marked.parse(response.data.response),
          iaModel: this.selectedModel,
          file: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.messages.push(assistantMessage);
        this.scrollToBottom();

        this.newMessage = "";
        this.uploadedFilePath = null;
        if (this.fileInputRef) this.fileInputRef.value = "";
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      } finally {
        this.loading = false;
      }
    },

    async handleFileUpload(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files ? input.files[0] : null
      if (!file) return;


      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post(
            `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/upload`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              onUploadProgress: (progressEvent: any) => {
                this.uploadProgress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
              },
            }
        );
        this.uploadProgress = 0;

        this.uploadedFilePath = response.data.fileUrl;
      } catch (error) {
        console.error("Erro no upload do arquivo:", error);
        alert("Erro ao enviar arquivo");
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.messageContainerRef;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
  }
};
</script>