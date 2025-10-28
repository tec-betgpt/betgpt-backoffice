<template>
  <SidebarProvider :defaultOpen="false">
    <Sidebar
      class="h-screen"
      collapsible="icon"
      :openMobile="false"
      @update:modelValue="handleSidebarExpand"
      :collapsed="sidebarExpanded"
    >
      <SidebarHeader v-if="activeGroupProject">
        <img
          @click="toggleSidebarOnMobile"
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
                  <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-sidebar-primary-foreground">
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

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage
                  v-if="authStore.user"
                  :src="authStore.user?.icon"
                />
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
                :to="{ name: 'services' }"
              >
                Serviços
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

          <Separator orientation="vertical" class="mr-2 h-4 hidden md:block" />

          <Breadcrumb class="flex-1">
            <BreadcrumbList class="flex flex-nowrap">
              <BreadcrumbItem>
                  <BreadcrumbLink as-child>
                    <Avatar @click="toggleSidebar" v-if="activeGroupProject" shape="square" class="size-6">
                      <AvatarImage
                        v-if="activeGroupProject && activeGroupProject.logo"
                        :src="activeGroupProject.logo"
                      />
                      <AvatarImage v-else src="/default-project.jpg" />
                      <AvatarFallback class="uppercase text-dark">
                        {{ activeGroupProject.name.slice(0, 2) }}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar @click="toggleSidebar" v-else shape="square" class="size-6">
                      <AvatarImage src="/default-project.jpg" />
                    </Avatar>
                  </BreadcrumbLink>
                <BreadcrumbSeparator />
              </BreadcrumbItem>

              <div
                v-for="(crumb, index) in breadcrumbs"
                :key="index"
                class="flex flex-nowrap items-center"
              >
                <BreadcrumbItem
                  :class="{
                    'hidden md:block': index !== breadcrumbs.length - 1,
                    'flex': index === breadcrumbs.length - 1
                  }"
                >
                  <BreadcrumbLink v-if="crumb.path" as-child>
                    <router-link class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs" :to="{ path: crumb.path }">
                      {{ crumb.title }}
                    </router-link>
                  </BreadcrumbLink>

                  <BreadcrumbPage v-else class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs">
                    {{ crumb.title }}
                  </BreadcrumbPage>

                </BreadcrumbItem>

                <BreadcrumbSeparator class="hidden md:block ml-2" v-if="index < breadcrumbs.length - 1" />
              </div>

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
      :collapsed="sidebarAi"
      :setOpen="setOpenAi"
      collapsible="offcanvas"
      :openMobile="false"
      @update:modelValue="handleSidebarAiExpand"
    >
      <SidebarHeader>
        <div class="flex justify-between items-center align-middle pl-2">
          <img
            :src="iconIa"
            alt="Logo"
            class="w-10 py-4"
          />

          <div class="flex justify-end items-center align-middle p-4 gap-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Plus
                    :stroke-width="2"
                    class="cursor-pointer"
                    absoluteStrokeWidth
                    @click="resetChat"
                  />
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
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
                  Nova sessão
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <History :stroke-width="2" absoluteStrokeWidth class="cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem v-for="chat in chats" :key="chat.id" @click="selectChat(chat.id)">
                  {{ chat.title }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div v-if="isLoadingChat" class="h-full flex items-center justify-center w-full">
          <LoadingFakeComponent />
        </div>

        <div class="h-full" v-else>
          <div v-if="messages.length == 0 && !file" class="p-4 text-center flex flex-col justify-center align-middle items-center text-sm h-full font-semibold">
            <div class="h-full flex flex-col justify-end items-center">
              <img :src="logoInChat" class="size-12" alt="logoInChat"/>
              <span>Como posso ajudar?</span>
            </div>

            <div  class="h-full flex flex-col justify-end items-center pb-2 gap-2 w-full">
              <div v-if="suggestionList.length>0" v-for="suggestion in suggestionList" @click="()=>{
                newMessage.message = suggestion
                sendMessage()
              }" class="p-2 rounded-xl bg-accent/60 text-accent-foreground/80 w-full flex gap-2 items-center cursor-pointer hover:bg-accent ">
                <Search :size="18" />  <span class="text-[12px] text-muted-foreground">{{suggestion}}</span>
              </div>
              <Skeleton v-else v-for="n in 4" class="h-12 rounded-xl bg-accent text-accent-foreground/80 w-full "/>
            </div>
          </div>

          <div v-else ref="messageContainerRef" type="hover" class=" overflow-x-hidden h-full px-6">
            <CustomTextChart
              v-for="(message, index) in messages" :key="message.id"
              class="mb-6 last:mb-20"
              :class="
              message.role === 'user'
                ? ' text-end justify-end bg-accent text-accent-foreground w-fit p-2 rounded-md ml-auto '
                : 'flex-col text-start justify-start'
              "
                :html="message.message"
                :start=" message.role !== 'user' && (index+1) === messages.length && isAnimating"
                :speed="8"
                @tick="scrollToBottom"
                @done="() => {
                  isAnimating = false
                  isInputDisabled = false
                }"
            />

            <div v-if="loading" class="flex flex-col gap-2">
              <Avatar class="h-4 w-4 rounded-lg">
                <AvatarImage :src="iconIa" />
                <AvatarFallback class="rounded-lg">
                  {{ authStore.user?.initials }}
                </AvatarFallback>
              </Avatar>
              <div class="loading-dots">
                <span v-for="n in 3" :key="n" :style="{ animationDelay: `${n * 0.2}s` }">.</span>
              </div>
            </div>
          </div>

          <div v-if="file" class="flex justify-end w-full items-center cursor-default gap-2 px-6">
            <Badge class="p-4">
              {{file.name}}
            </Badge>
            <Button v-if="!loading" variant="ghost" @click="()=>{
              file = undefined
            }">
              <Trash/>
            </Button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter >
        <div class="relative w-full items-center mb-2">
          <Button
            variant="link"
            @click="sendMessage"
            :disabled="isInputDisabled"
            class="absolute end-0 flex items-center justify-center h-full"
          >
            <SendHorizontal  :stroke-width="2.5"  absoluteStrokeWidth />
          </Button>
          <span class="absolute start-0 inset-y-0 z-10 flex items-center justify-center px-2">
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <PopoverTrigger as-child>
                      <Ellipsis :stroke-width="2.5" absoluteStrokeWidth class="cursor-pointer"  />
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    :align-offset="-4"
                    :arrow-padding="8"
                    avoid-collisions
                    :collision-padding="10"
                    hide-when-detached
                    position-strategy="absolute"
                    sticky="always"
                    update-position-strategy="optimized"
                    :collision-boundary="null"
                  >
                    Opcões
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent align="start" :alignOffset="-8" :sideOffset="16" :arrowPadding="0" class="w-56 p-2">
                <div class="flex flex-col gap-2 text-sm">
                  <Label
                    for="file"
                    class="cursor-pointer text-sm truncate py-2 px-1 flex gap-4 text-center align-baseline justify-start items-center font-semibold rounded-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Paperclip class="size-4" />
                    Anexar
                  </Label>
                <Input
                  id="file"
                  type="file"
                  class="hidden"
                  @change="handleFileUpload"
                  :disabled="isInputDisabled"
                />
                </div>
              </PopoverContent>
            </Popover>
          </span>
          <Input
            id="search"
            @keyup.enter="!isInputDisabled && sendMessage()"
            v-model="newMessage.message"
            type="text"
            placeholder="Pergunte alguma coisa"
            class="px-10 h-12"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  </SidebarProvider>
</template>

<script setup lang="ts">
import {
  Download,
  Paperclip,
  EyeClosed,
  Eye,
  Trash,
  History,
  Ellipsis,
  SendHorizontal,
  Search
} from "lucide-vue-next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  Plus
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
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
import { Label } from "@/components/ui/label";
import { marked } from "marked";
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import CustomTextChart from "@/components/custom/CustomTextChart.vue";
import {Badge} from "@/components/ui/badge";
import {Skeleton} from "@/components/ui/skeleton";
import LoadingFakeComponent from "@/components/layout/LoadingFakeComponent.vue";

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
  id: number | undefined;
  role: "user" | "assistant";
  message: string;
  file: File | null;
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
const sidebarAi = ref(false);
const mode: any = useColorMode();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const configStore = useConfigStore();
const route = useRoute();
const router = useRouter();

// Chat e mensagens
const chats = ref<Chat[]>([]);
const isLoadingChat = ref(false);
const selectedChatId = ref<number | undefined>(undefined);
const messages = ref<Message[]>([]);
const newMessage = ref<Message>({ id: 0, role: "user", message: "", file: null });
const loading = ref(false);
const file = ref<File>();
const messageContainerRef = ref<HTMLElement | null>(null);
const isShowValues = ref(false);
const isAnimating = ref(false);
const isInputDisabled = computed(() => loading.value || isAnimating.value);
const suggestionList = ref([])

// Computed
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];

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

const logoSrc = computed(() =>
  getLogoSrc(mode.value === "dark", sidebarExpanded.value)
);

const logoInChat = computed(() =>
    getLogoSrc(mode.value === "dark", false)
);

const iconIa = computed(() => {
  return mode.value === "dark"
    ? "/logo-elevate-square-white.png"
    : "/logo-elevate-square-black.png";
});

const logoCustomAi = computed(() => {
  return mode.value === "dark"
    ? "/svg/logo-ia-v1-white.svg"
    : "/svg/logo-ia-v1-black.svg";
});

const navMenu = computed(() => {
  return [
    {
      name: "Home",
      url: { name: "home" },
      icon: Home,
      show: canAccess("access-to-dashboard"),
    },
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
          name: "Usuários",
          url: { name: "users" },
          icon: Users2,
          show: canAccess("access-to-users"),
        },
        {
          name: "Perfis",
          url: { name: "roles" },
          icon: UserCog,
          show: canAccess("access-to-permissions"),
        },
        {
          name: "MyElevate Insights",
          url: { name: "texts" },
          icon: Album,
          show: canAccess("access-to-motivational-texts"),
        },
        {
          name: "Fontes de Dados",
          url: { name: "data-sources" },
          icon: Blocks,
          show: canAccess("access-to-integrations"),
        },
        {
          name: "Logins",
          url: { name: "user-logins" },
          icon: History,
          show: canAccess("access-to-users"),
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
const handleSidebarAiExpand = () => {
  sidebarAi.value = false;
};

const scrollToBottom = () => {
  nextTick(() => {
    const container = messageContainerRef.value;
    if (container) {
      messageContainerRef.value!.scrollTop = container.scrollHeight;
    }
  });
};

const toggleValues = () => {
  isShowValues.value = !isShowValues.value;
};

const getLogoSrc = (isDarkMode: boolean, isSidebarExpanded: boolean) => {
  const logos = isDarkMode ? DARK_LOGOS : LIGHT_LOGOS;
  return isSidebarExpanded ? logos.full : logos.square;
};

const hasPermission = (permissionName: string) => {
  return !!authStore.user?.roles.some((role: any) =>
    role.permissions.some(
      (permission: any) => permission.name === permissionName
    )
  );
};

const hasPermissionInActiveProject = (permissionName: string) => {
  return !!authStore.user?.roles
    .filter(
      (role: any) =>
        activeGroupProject &&
        role.pivot.project_id === activeGroupProject.project_id!
    )
    .some((role: any) =>
      role.permissions.some(
        (permission: any) => permission.name === permissionName
      )
    );
}

const canAccess = (permissionName: string) => {
  return (hasPermission(permissionName)) || hasPermissionInActiveProject(permissionName);
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

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value;
};

const handleSidebarExpand = (value: boolean) => {
  sidebarExpanded.value = value;
};

const toggleSidebarIA = () => {
  localStorage.setItem("sidebarAi", sidebarAi.value ? "0" : "1");
  sidebarAi.value = !sidebarAi.value;
};

const loadChats = async () => {
  loading.value = true;

  try {

    const data = await IntelligenceArtificial.getListSessions();
    chats.value = data.data;
  } catch (err) {
    console.error("Erro ao carregar chats:", err);
  }

  loading.value = false;
};

const getSuggestions = async () => {
  try {
    const suggestions = await IntelligenceArtificial.getSuggestions();
    suggestionList.value  = suggestions.data
  } catch (e) {
    console.log(e)
  }
};

const createNewChat = async () => {
  try {
    const response = await IntelligenceArtificial.createSession();
    selectedChatId.value = response.data.id;

  } catch (error) {
    console.error("Erro ao criar chat:", error);
  }
};

const selectChat = async (chatId: number) => {
  if (chatId == 0 ) return

  isLoadingChat.value = true
  selectedChatId.value = chatId;
  localStorage.setItem('chatId', `${chatId}`)
  await loadMessages();
  isLoadingChat.value = false
};

const loadMessages = async () => {
  if (!selectedChatId.value) return;

  messages.value = [];
  loading.value = true;

  try {
    const data = await IntelligenceArtificial.getSession({
      chat_id: selectedChatId.value,
    });

    messages.value = data.data.map((message: any) => ({
      id: message.id,
      role: message.role,
      message: marked.parse(message.message[0]),
      file: null,
    }));
    scrollToBottom();
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.message) {
    toast({
      title: "Adicione um Texto",
    });
    return;
  }

  if (selectedChatId.value === undefined) {
    await createNewChat();
    await sendMessage();
  } else {
    const userMessage = {
      chat_id: selectedChatId.value,
      message: newMessage.value.message,
      file:  newMessage.value.file,
      project_id: activeGroupProject.value?.id,
    };

    loading.value = true;
    newMessage.value.id = messages.value.length;
    try {
      messages.value.push(newMessage.value);
      scrollToBottom();

      newMessage.value = { id: 0, role: "user", message: "", file: null };

      const response = await IntelligenceArtificial.sendMessage(userMessage);
      file.value = undefined;
      const assistantMessage: Message = {
        id: messages.value.length,
        role: "assistant",
        message: await marked.parse(response.data.message),
        file: null,
      };

      messages.value.push(assistantMessage);
      scrollToBottom();
      loading.value = false;
      isAnimating.value = true;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      loading.value = false;
      isAnimating.value = false;
    }
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
    file.value = target.files[0];
    newMessage.value.file = file.value;
};

const resetChat = async () => {
  selectedChatId.value = undefined;
  localStorage.removeItem('chatId')
  messages.value = []
  file.value = undefined;
  newMessage.value = { id: undefined, role: 'user', message: '', file: null };
  await loadChats()
};

const setOpenAi = () => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    return sidebarAi.value = localStorage.getItem("sidebarAi") === "1";
  }
};

const toggleSidebarOnMobile = () => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    toggleSidebar()
  } else {
    router.push({ name: "home" })
  }
}

const minSwipeDistance = 60;
const edgeArea = 48;
const touch = {
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
};

const onTouchStart = (e: TouchEvent) => {
  const touchEvent = e.changedTouches[0];
  touch.startX = touchEvent.clientX;
  touch.startY = touchEvent.clientY;
  touch.endX = touch.startX;
  touch.endY = touch.startY;
};
const onTouchMove = (e: TouchEvent) => {
  const touchEvent = e.changedTouches[0];
  touch.endX = touchEvent.clientX;
  touch.endY = touchEvent.clientY;
};
const onTouchEnd = () => {
  const deltaX = touch.endX - touch.startX;
  const deltaY = Math.abs(touch.endY - touch.startY);

  if (deltaY > 60) return;

  if (deltaX > minSwipeDistance && touch.startX < edgeArea) {
    sidebarExpanded.value = true;
    sidebarAi.value = false;
  }

  if (
    deltaX < -minSwipeDistance &&
    touch.startX > window.innerWidth - edgeArea
  ) {
    sidebarAi.value = true;
    sidebarExpanded.value = false;
  }

  if (
    deltaX < -minSwipeDistance &&
    sidebarExpanded.value &&
    touch.startX < 240
  ) {
    sidebarExpanded.value = false;
  }

  if (
    deltaX > minSwipeDistance &&
    sidebarAi.value &&
    touch.startX > window.innerWidth - 240
  ) {
    sidebarAi.value = false;
  }
};

const swipeSidebars = () => {
  const isMobile = window.innerWidth < 1024;
  if (!isMobile) return;

  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
};

onUnmounted(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
});

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


onMounted(async () => {
  mode.value = localStorage.getItem("theme") || "auto";
  const user = authStore.user;

  if (user) {
    await workspaceStore.loadInitialData(user.preferences, user.group_projects);
    await getSuggestions();
    await loadChats();
  }

  setTimeout(() => setOpenAi(), 100);
  swipeSidebars();
});
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
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  40% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
