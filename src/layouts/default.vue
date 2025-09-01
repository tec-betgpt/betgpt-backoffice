<template>
  <SidebarProvider>
    <Sidebar
      class="h-screen"
      collapsible="icon"
      @update:modelValue="handleSidebarExpand"
      :collapsed="sidebarExpanded"
    >
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
                <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-sidebar-primary-foreground">
                    <Avatar shape="square" class="size-7">
                      <AvatarImage v-if="activeGroupProject && activeGroupProject.logo" :src="activeGroupProject.logo"  />
                      <AvatarImage v-else src="/default-company.jpg"  />
                      <AvatarFallback class="uppercase  text-white">
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
                    <div class="flex size-6 items-center justify-center rounded-sm border">
                      <Avatar shape="square" class="size-7">
                        <AvatarImage v-if="project.logo" :src="project.logo"  />
                        <AvatarImage v-else src="/default-company.jpg"  />
                        <AvatarFallback class="uppercase  text-white">
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

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
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
              <router-link class="w-full" :to="{ name: 'configurations.profile' }">
                Configurações
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
    <SidebarInset>
      <header class="flex sticky z-10 top-0 bg-background/5 backdrop-blur-md h-16 shrink-0 items-center gap-2 px-4">
        <div class="flex items-center gap-2 w-full px-4">
          <SidebarTrigger :logo="true" :toggle="toggleSidebar" class="-ml-1" />

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

          <button @click="toggleValues()" class="mr-3">
            <Eye v-if="isShowValues" class="w-5 h-5 text-primary" />
            <EyeClosed v-else class="w-5 h-5 text-primary" />
          </button>

          <SidebarTrigger
            :logo="false"
            :toggle="toggleSidebarIA"
            :logoCustom="logoCustomAi"
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
          <router-view :isShowValues="isShowValues"></router-view>
        </div>
      </main>
    </SidebarInset>

    <Sidebar
      class="ia"
      side="right"
      :collapsed="sidebarIaExpanded"
      @update:modelValue="handleSidebarIaExpand"
      collapsible="offcanvas"
    >
      <SidebarHeader class="p-4 flex-4">
        <div class="flex justify-between align-middle">
          <h1 class="font-bold">Elevate IA</h1>
          <Button variant="ghost" @click=" async ()=>{
            await createNewChat()
            await loadMessages()
          }">
            <SquarePen /> Novo Chat
          </Button>
        </div>

        <div>
          <p class="text-[16px] py-4">Histórico</p>
          <div class="card max-h-16 overflow-y-scroll overflow-x-hidden">
            <p
              v-for="chat in chats"
              :key="chat.id"
              @click="selectChat(chat.id)"
              class="border-b-2 text-[10px] cursor-pointer truncate py-2"
            >
              {{ chat.title }}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent class="p-4 flex-1">
        <div
          ref="messageContainerRef"
          class="card h-full w-full rounded-sm shadow-md flex-col flex p-2 overflow-y-scroll overlay-x-hidden"
        >
          <div v-for="message in messages" :key="message.id" class="mb-4">
            <div
              class="space-x-2 pb-2"
              :class="
                message.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              "
            >
              <Avatar class="h-4 w-4 rounded-lg">
                <AvatarImage
                  :src="
                    message.role === 'user' ? authStore.user?.icon : iconIa
                  "
                />
                <AvatarFallback class="rounded-lg">
                  {{ authStore.user?.initials }}
                </AvatarFallback>
              </Avatar>
              <p class="text-[10px]">
                {{ message.role === "user" ? "Você" : "I.A" }}
              </p>
            </div>
            <p
              class="text-[12px] w-full flex flex-col"
              :class="
                message.role === 'user'
                  ? ' text-end justify-end'
                  : 'flex text-start justify-start'
              "
              v-html="message.message"
            />
            <div v-if="message.file" class="mt-2">
              <a
                :href="message.file"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                {{ extractFileName(message.file) }}
              </a>
            </div>
          </div>

          <div v-if="loading" class="flex flex-col gap-2">
            <Avatar class="h-4 w-4 rounded-lg">
              <AvatarImage
                  :src="iconIa"
              />
              <AvatarFallback class="rounded-lg">
                {{ authStore.user?.initials }}
              </AvatarFallback>
            </Avatar>
            <div class="loading-dots">
              <span v-for="n in 3" :key="n" :style="{ animationDelay: `${n * 0.2}s` }">.</span>
            </div>
<!--            <Skeleton class="w-full h-3" />-->
<!--            <Skeleton class="w-full h-3" />-->
          </div>
          <div
            v-if="uploadedFilePath"
            class="flex justify-end w-full items-center"
          >
            <Badge
              class="max-w-[80%] lg:max-w-[60%] shadow-md transition-all flex items-start px-3 py-2"
            >
              <div>
<!--                <div-->
<!--                  v-if="-->
<!--                    uploadedFilePath.endsWith('.jpg') ||-->
<!--                    uploadedFilePath.endsWith('.jpeg') ||-->
<!--                    uploadedFilePath.endsWith('.png') ||-->
<!--                    uploadedFilePath.endsWith('.gif')-->
<!--                  "-->
<!--                >-->
<!--                  <img-->
<!--                    :src="uploadedFilePath"-->
<!--                    alt="Pré-visualização da Imagem"-->
<!--                    class="max-h-32 max-w-full object-cover my-2"-->
<!--                  />-->
<!--                </div>-->
<!--                <div v-else-if="uploadedFilePath.endsWith('.pdf')">-->
<!--                  <iframe :src="uploadedFilePath" class="w-full" />-->
<!--                </div>-->
<!--                <div v-else-if="uploadedFilePath.endsWith('.txt')">-->
<!--                  <p>Arquivo de Texto anexado</p>-->
<!--                </div>-->
                <div v-if="uploadedFilePath">
                  <p>Arquivo anexado</p>
                </div>
                <Progress v-if="uploadProgress > 0" v-model="uploadProgress" />
              </div>
            </Badge>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter class="p-4  flex-5 grid grid-cols-1 gap-2">
        <Textarea
          placeholder="Digite aqui..."
          @keyup.enter="sendMessage"
          v-model="newMessage"
        />
        <Button class="bg-[#947c2c]" @click="sendMessage" :disabled="loading"> Enviar </Button>
        <Label
          for="file"
          class="flex w-full justify-center border p-2 rounded-sm items-center gap-2 cursor-pointer"
        >
          <Paperclip :size="16"/> Anexar arquivo
        </Label>
        <Input
          id="file"
          type="file"
          class="hidden"
          @change="handleFileUpload"
        />
        <p class="text-[8px]">
          As respostas podem mostrar informações imprecisas qualquer duvida
          entre em contato conosco.
        </p>
      </SidebarFooter>
    </Sidebar>
  </SidebarProvider>
</template>

<script setup lang="ts">
import {Download, Paperclip, X, SquarePen, EyeClosed, Eye} from "lucide-vue-next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Rows3,
  ChevronRight,
  SquareStack,
  CircleDollarSign,
  ExternalLink,
  Briefcase,
  DollarSignIcon,
  Blocks,
  Logs,
  History,
  UserCog,
  LayoutList,
} from "lucide-vue-next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useColorMode } from "@vueuse/core";
import CustomLoading from "@/components/custom/CustomLoading.vue";
import { useConfigStore } from "@/stores/config";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { marked } from "marked";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import {toast} from "@/components/ui/toast";

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
  role: "user" | "assistant";
  message: string;
  file: string | null;
}

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
const sidebarExpanded = ref(false);
const sidebarIaExpanded = ref(false);
const stateResponsive = ref(false);
const mode: any = useColorMode();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

// Chat e mensagens
const chats = ref<Chat[]>([]);
const selectedChatId = ref<number | undefined>(undefined);
const selectedModel = ref("openai");
const messages = ref<Message[]>([]);
const newMessage = ref("");
const uploadProgress = ref(0);
const uploadedFilePath = ref<string | null>(null);
const loading = ref(false);
const showNewChatModal = ref(false);
const newChatTitle = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const messageContainerRef = ref<HTMLElement | null>(null);
const isShowValues = ref(false);

// Computed
const activeGroupProject = computed(() => workspaceStore.activeGroupProject || null);
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { name: "Elevate", title: "Elevate", path: "/home" },
  ];

  route.matched.forEach((record, index) => {
    const name = record.name as string;
    const title = record.meta.title as string;
    items.push({
      name,
      title,
      path: index === route.matched.length - 1 ? null : record.path,
    });
  });

  return items;
});
const logoSrc = computed(() => getLogoSrc(mode.value === "dark", sidebarExpanded.value));
const iconIa = computed(() => {
  return mode.value === "dark" ? "/logo-elevate-square-white.png" : "/logo-elevate-square-black.png";
});
const logoCustomAi = computed(() => {
  return mode.value === "dark" ? "/svg/elevate-ai-white.svg" : "/svg/elevate-ai-black.svg";
});

const navMenu = computed(() => {
  return [
    {
      name: "Home",
      url: { name: "home" },
      icon: Home,
      show: canAccess("access-to-dashboard")
    },
    {
      name: "Jarbas BOT",
      icon: Bot,
      url: { name: "jarbas-bot" },
      type: "ia",
      show: canAccess("access-to-ai")
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
          show: canAccess("view-segments")
        },
        {
          name: "Atribuições",
          url: { name: "attributions" },
          icon: ExternalLink,
          show: canAccess("access-to-parameter-tracking")
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
      name: "Controles",
      icon: SlidersHorizontal,
      type: "controls",
      show: canAccess("access-to-reports"),
      children: [
        {
          name: "Performance",
          url: { name: "performances" },
          icon: LineChart,
          show: canAccess("access-to-reports")
        },
        {
          name: "Tráfego",
          url: { name: "traffics" },
          icon: ChartNoAxesCombined,
          show: canAccess("access-to-reports")
        },
        {
          name: "E-mails",
          url: { name: "emails" },
          icon: MailCheck,
          show: canAccess("access-to-reports")
        },
        {
          name: "SMS Insights",
          url: { name: "sms-insights" },
          icon: Send,
          show: canAccess("access-to-reports")
        },
      ],
    },
    {
      name: "Gerenciamento",
      icon: SquareStack,
      type: "manage",
      show: canAccess("access-to-client-management") || canAccess("access-to-member-management"),
      children: [
        {
          name: "Grupo de Projetos",
          url: { name: "configurations.projects" },
          icon: LayoutList,
          show: canAccess("access-to-project-groups")
        },
        {
          name: "Projetos",
          url: { name: "projects" },
          icon: Building2,
          show: canAccess("access-to-project-groups")
        },
        {
          name: "Usuários",
          url: { name: "users" },
          icon: Users2,
          show: canAccess("access-to-users")
        },
        {
          name: "Perfis",
          url: { name: "roles" },
          icon: UserCog,
          show: canAccess("access-to-permissions")
        },
        {
          name: "MyElevate Insights",
          url: { name: "texts" },
          icon: Album,
          show: canAccess("access-to-motivational-texts")
        },
        {
          name: "Integrações",
          url: { name: "integrations" },
          icon: Blocks,
          show: canAccess("access-to-integrations")
        },
        {
          name: "Postback Logs",
          url: { name: "postback-logs" },
          icon: Logs,
          show: canAccess("access-to-postback-logs")
        },
        {
          name: "Logins",
          url: { name: "user-logins" },
          icon: History,
          show: canAccess("access-to-users")
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
          show: canAccess("access-to-finance")
        },
        {
          name: "Gerir Custos",
          url: { name: "costs" },
          icon: Rows3,
          show: canAccess("access-to-finance")
        },
        {
          name: "Entradas e Saídas",
          url: { name: "registers" },
          icon: DollarSignIcon,
          show: canAccess("access-to-finance")
        },
      ],
    },
  ];
});

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

watch(activeGroupProject, async () => {
    if (activeGroupProject.value) {
      const is = authStore.user?.roles
        .filter((role: any) => role.pivot.project_id === activeGroupProject.value?.project_id)
        .some((role: any) => route.meta.permissions?.includes?.(role.permissions.map((p: any) => p.name)) ?? true);

      const hasAccess = authStore.user?.access_type === "member" || is;

      if (!hasAccess) await router.push({ name: "home" });
    }
  },
  { immediate: true }
);

watch(uploadedFilePath, (newVal, oldVal) => {
  if (oldVal) URL.revokeObjectURL(oldVal);
});

onMounted(async () => {
  mode.value =  localStorage.getItem("theme") || "auto"
  const user = authStore.user;
  if (user) {
    await workspaceStore.loadInitialData(user.preferences, user.group_projects);
    await loadChats();
  }
});

const setResponsive = () => (stateResponsive.value = !stateResponsive.value);

function scrollToBottom() {
  nextTick(() => {
    const container = messageContainerRef.value;
    if (container) {
      messageContainerRef.value!.scrollTop = container.scrollHeight;
    }
  });
}

function toggleValues() {
  isShowValues.value = !isShowValues.value;
}

function getLogoSrc(isDarkMode: boolean, isSidebarExpanded: boolean): string {
  const logos = isDarkMode ? DARK_LOGOS : LIGHT_LOGOS;
  return isSidebarExpanded ? logos.full : logos.square;
}

/**
 * @description Verificar permissões do usuário
 * @param permissionName
 * @author Tavares <gerson.tavares@myelevate.com.br>
 */
function hasPermission(permissionName: string): boolean {
  return !!authStore.user?.roles.some((role: any) =>
    role.permissions.some((permission: any) => permission.name === permissionName)
  );
}

/**
 * @description Verificar permissões em projetos ativos
 * @param permissionName
 * @author Tavares <gerson.tavares@myelevate.com.br>
 */
function hasPermissionInActiveProject(permissionName: string): boolean {
  return !!authStore.user?.roles
    .filter((role: any) => activeGroupProject && role.pivot.project_id === activeGroupProject.project_id!)
    .some((role: any) => role.permissions.some((permission: any) => permission.name === permissionName));
}

/**
 * @param permissionName
 * @author Tavares <gerson.tavares@myelevate.com.br>
 */
function canAccess(permissionName: string): boolean {
  return (
    (authStore.user?.access_type === "member" && hasPermission(permissionName)) ||
    hasPermissionInActiveProject(permissionName)
  );
}

const setActiveGroupProject = async (project: any) => {
  sidebarExpanded.value = false;
  configStore.loading = true;

  await workspaceStore.setActiveGroupProject(project);

  setTimeout(() => {
    configStore.loading = false;
    const isMobile = window.innerWidth < 768;
    if(isMobile){
      sidebarExpanded.value = false;
    }else{
      sidebarExpanded.value = true;
    }
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

const toggleSidebar = () => {
  setResponsive();
  sidebarExpanded.value = !sidebarExpanded.value;
};

const handleSidebarExpand = (value: boolean) => {
  sidebarExpanded.value = value;
};
const handleSidebarIaExpand = (value: boolean) => {
  sidebarIaExpanded.value = value;
};
const toggleSidebarIA = () => {
  setResponsive();
  sidebarIaExpanded.value = !sidebarIaExpanded.value;
};

const loadChats = async () => {
  loading.value = true;

  try {
    const data = await IntelligenceArtificial.getListSessions()
    chats.value = data.data;
  } catch (err) {
    console.error("Erro ao carregar chats:", err);
  }

  loading.value = false;
};

const createNewChat = async () => {
  try {
    const response = await IntelligenceArtificial.createSession()
    selectedChatId.value = response.data.id;

    newChatTitle.value = "";
  } catch (error) {
    console.error("Erro ao criar chat:", error);
  } finally {
    showNewChatModal.value = false;
  }
};

const deleteChat = async (chatId: number) => {
  if (!confirm("Tem certeza que deseja excluir este chat?")) return;

  try {
    await axios.delete(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    chats.value = chats.value.filter((c) => c.id !== chatId);
    if (selectedChatId.value === chatId) {
      selectedChatId.value =
          chats.value.length > 0 ? chats.value[0].id : undefined;
    }
  } catch (error) {
    console.error("Erro ao excluir chat:", error);
  }
};

const selectChat = async (chatId: number) => {
  selectedChatId.value = chatId;
  await loadMessages();
};

const loadMessages = async () => {
  if (!selectedChatId.value) return;

  messages.value = [];
  loading.value = true;

  try {
    const data = await  IntelligenceArtificial.getSession({chat_id: selectedChatId.value});
    messages.value = data.data.map((message: any) => ({
      id: message.id,
      role: message.role,
      message: marked.parse(message.message[0]),
      file: null
    })).reverse();
    scrollToBottom();
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
  } finally {
    loading.value = false;
  }
};
const file = ref<File>();
const sendMessage = async () => {
  if (!newMessage.value) {
    toast({
      title:"Adicione um Texto",
    })
    return
  }

  if (selectedChatId.value === undefined) {
    await createNewChat();
    await sendMessage();
  }
  else {

    const userMessage = {
      chat_id: selectedChatId.value,
      message: newMessage.value,
      file: file.value
    };

    loading.value = true;

    try {
      messages.value.push({
        message:newMessage.value,
        file: uploadedFilePath.value,
        role:"user",
        id:messages.value.length
      });
      scrollToBottom();

      newMessage.value = "";
      uploadedFilePath.value = null;

      const response = await  IntelligenceArtificial.sendMessage(userMessage)
      file.value = undefined
      const assistantMessage: Message = {
        id:messages.value.length,
        role: "assistant",
        message: marked.parse(response.data.message),
        file: null,
      };

      messages.value.push(assistantMessage);
      scrollToBottom();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      loading.value = false;
    }
  }
};

const extractFileName = (url: string): string => {
  return url.split("/").pop() || "";
};

const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  if (!selected) return;

  file.value = selected;
  uploadedFilePath.value = URL.createObjectURL(selected);
};
</script>
<style>
.loading-dots {
  display: flex;
  justify-content: start;
  align-items: flex-end;
  font-size: 2rem;
  height: 2.5rem; /* altura do container */
}

.loading-dots span {
  display: inline-block;
  margin: 0 0.1rem;
  animation: bounce 0.8s infinite ease-in-out;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  40% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
