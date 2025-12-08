<template>
  <SidebarProvider :defaultOpen="false">
    <LeftMenuComponent
      v-model:sidebarExpanded="sidebarExpanded"
    />
    <SidebarInset>
      <header
        class="flex sticky z-30 top-0 bg-background/5 backdrop-blur-md h-16 shrink-0 items-center gap-2 px-4"
      >
        <div class="flex items-center gap-2 w-full px-4">
          <SidebarTrigger :logo="true" :toggle="toggleSidebar" class="-ml-1" />

          <Separator orientation="vertical" class="mr-2 h-4 hidden md:block" />

          <Breadcrumb class="flex-1">
            <BreadcrumbList class="flex flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink as-child>
                  <Avatar
                    @click="toggleSidebar"
                    v-if="activeGroupProject"
                    shape="square"
                    class="size-6"
                  >
                    <AvatarImage
                      v-if="activeGroupProject && activeGroupProject.logo"
                      :src="activeGroupProject.logo"
                    />
                    <AvatarImage v-else src="/default-project.jpg" />
                    <AvatarFallback class="uppercase text-dark">
                      {{ activeGroupProject.name.slice(0, 2) }}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar
                    @click="toggleSidebar"
                    v-else
                    shape="square"
                    class="size-6"
                  >
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
                    flex: index === breadcrumbs.length - 1,
                  }"
                >
                  <BreadcrumbLink v-if="crumb.path" as-child>
                    <router-link
                      class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs"
                      :to="{ path: crumb.path }"
                    >
                      {{ crumb.title }}
                    </router-link>
                  </BreadcrumbLink>

                  <BreadcrumbPage
                    v-else
                    class="truncate whitespace-nowrap overflow-hidden max-w-[100px] md:max-w-xs"
                  >
                    {{ crumb.title }}
                  </BreadcrumbPage>
                </BreadcrumbItem>

                <BreadcrumbSeparator
                  class="hidden md:block ml-2"
                  v-if="index < breadcrumbs.length - 1"
                />
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
          <img :src="iconIa" alt="Logo" class="w-10 py-4" />

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
                <History
                  :stroke-width="2"
                  absoluteStrokeWidth
                  class="cursor-pointer"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  v-for="chat in chats"
                  :key="chat.id"
                  @click="selectChat(chat.id)"
                >
                  {{ chat.title }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div
          v-if="isLoadingChat"
          class="h-full flex items-center justify-center w-full"
        >
          <LoadingFakeComponent />
        </div>

        <div class="h-full" v-else>
          <div
            v-if="messages.length == 0 && !file"
            class="p-4 text-center flex flex-col justify-center align-middle items-center text-sm h-full font-semibold"
          >
            <div class="h-full flex flex-col justify-end items-center">
              <img :src="logoInChat" class="size-12" alt="logoInChat" />
              <span>Como posso ajudar?</span>
            </div>

            <div
              class="h-full flex flex-col justify-end items-center pb-2 gap-2 w-full"
            >
              <div
                v-if="suggestionList.length > 0"
                v-for="suggestion in suggestionList"
                @click="
                  () => {
                    newMessage.message = suggestion;
                    sendMessage();
                  }
                "
                class="p-2 rounded-xl bg-accent/60 text-accent-foreground/80 w-full flex gap-2 items-center cursor-pointer hover:bg-accent"
              >
                <Search :size="18" />
                <span class="text-[12px] text-muted-foreground">{{
                  suggestion
                }}</span>
              </div>
              <Skeleton
                v-else
                v-for="n in 4"
                class="h-12 rounded-xl bg-accent text-accent-foreground/80 w-full"
              />
            </div>
          </div>

          <div
            v-else
            ref="messageContainerRef"
            type="hover"
            class="overflow-x-hidden h-full px-6"
          >
            <CustomTextChart
              v-for="(message, index) in messages"
              :key="message.id"
              class="mb-6 last:mb-20"
              :class="
                message.role === 'user'
                  ? ' text-end justify-end bg-accent text-accent-foreground w-fit p-2 rounded-md ml-auto '
                  : 'flex-col text-start justify-start'
              "
              :html="message.message"
              :start="
                message.role !== 'user' &&
                index + 1 === messages.length &&
                isAnimating
              "
              :speed="8"
              @tick="scrollToBottom"
              @done="
                () => {
                  isAnimating = false;
                  isInputDisabled = false;
                }
              "
            />

            <div v-if="loading" class="flex flex-col gap-2">
              <Avatar class="h-4 w-4 rounded-lg">
                <AvatarImage :src="iconIa" />
                <AvatarFallback class="rounded-lg">
                  {{ authStore.user?.initials }}
                </AvatarFallback>
              </Avatar>
              <div class="loading-dots">
                <span
                  v-for="n in 3"
                  :key="n"
                  :style="{ animationDelay: `${n * 0.2}s` }"
                  >.</span
                >
              </div>
            </div>
          </div>

          <div
            v-if="file"
            class="flex justify-end w-full items-center cursor-default gap-2 px-6"
          >
            <Badge class="p-4">
              {{ file.name }}
            </Badge>
            <Button
              v-if="!loading"
              variant="ghost"
              @click="
                () => {
                  file = undefined;
                }
              "
            >
              <Trash />
            </Button>
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div class="relative w-full items-center mb-2">
          <Button
            variant="link"
            @click="sendMessage"
            :disabled="isInputDisabled"
            class="absolute end-0 flex items-center justify-center h-full"
          >
            <SendHorizontal :stroke-width="2.5" absoluteStrokeWidth />
          </Button>
          <span
            class="absolute start-0 inset-y-0 z-10 flex items-center justify-center px-2"
          >
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <PopoverTrigger as-child>
                      <Ellipsis
                        :stroke-width="2.5"
                        absoluteStrokeWidth
                        class="cursor-pointer"
                      />
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
              <PopoverContent
                align="start"
                :alignOffset="-8"
                :sideOffset="16"
                :arrowPadding="0"
                class="w-56 p-2"
              >
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Plus,
  Paperclip,
  EyeClosed,
  Eye,
  Trash,
  History,
  Ellipsis,
  SendHorizontal,
  Search,
} from "lucide-vue-next";
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
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import CustomTextChart from "@/components/custom/CustomTextChart.vue";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingFakeComponent from "@/components/layout/LoadingFakeComponent.vue";
import Projects from "@/services/projects";
import LeftMenuComponent from "@/components/layout/LeftMenuComponent.vue";

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
const newMessage = ref<Message>({
  id: 0,
  role: "user",
  message: "",
  file: null,
});
const loading = ref(false);
const file = ref<File>();
const messageContainerRef = ref<HTMLElement | null>(null);
const isShowValues = ref(false);
const isAnimating = ref(false);
const isInputDisabled = computed(() => loading.value || isAnimating.value);
const suggestionList = ref([]);

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

const logoInChat = computed(() => getLogoSrc(mode.value === "dark", false));

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

const toggleSidebar = () => {
  sidebarExpanded.value = !sidebarExpanded.value;
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
    suggestionList.value = suggestions.data;
  } catch (e) {
    console.log(e);
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
  if (chatId == 0) return;

  isLoadingChat.value = true;
  selectedChatId.value = chatId;
  localStorage.setItem("chatId", `${chatId}`);
  await loadMessages();
  isLoadingChat.value = false;
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
      file: newMessage.value.file,
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
  localStorage.removeItem("chatId");
  messages.value = [];
  file.value = undefined;
  newMessage.value = { id: undefined, role: "user", message: "", file: null };
  await loadChats();
};

const setOpenAi = () => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    return (sidebarAi.value = localStorage.getItem("sidebarAi") === "1");
  }
};

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

const fetchStatusOAuth2 = async () => {
  try {
   const response = await Projects.statusOAuth({project_id:workspaceStore.activeGroupProject.project_id})
    if (response.data.length === 0) return;
    const status = response.data
    status.forEach((item) => {
      toast({
        variant:'destructive',
        description:item.status_description,
        duration:3000,
        title:item.name,
      })
    })
  } catch (e) {
    console.error(e)
  }
}

onUnmounted(() => {
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("touchend", onTouchEnd);
});

onMounted(async () => {
  mode.value = localStorage.getItem("theme") || "auto";
  const user = authStore.user;

  if (user) {
    await workspaceStore.loadInitialData(user.preferences, user.group_projects);
    fetchStatusOAuth2()
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
