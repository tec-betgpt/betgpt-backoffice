<template>
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
      <CustomStarScore v-if="messages.length > 0" :readonly="false" :modelValue="star" @update:modelValue="args => star = args" >
        <form @submit.prevent="sendFeed" class="flex justify-end flex-col gap-2">
          <Textarea placeholder="Feedback" v-model="feedback"/>
          <Button >
            Enviar Feedback
          </Button>
        </form>

      </CustomStarScore>
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
</template>

<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
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
  Trash,
  History,
  Ellipsis,
  SendHorizontal,
  Search,
} from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { Label } from "@/components/ui/label";
import { marked } from "marked";
import { computed, nextTick, onMounted, ref, toRefs } from "vue";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import CustomTextChart from "@/components/custom/CustomTextChart.vue";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingFakeComponent from "@/components/layout/LoadingFakeComponent.vue";
import CustomStarScore from "@/components/custom/CustomStarScore.vue";
import {Textarea} from "@/components/ui/textarea";

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

const props = defineProps({
  sidebarAi: Boolean,
  logoCustomAi: String,
});

const emit = defineEmits(["update:sidebarAi"]);

const { sidebarAi } = toRefs(props);

const DARK_LOGOS = {
  square: "/logo-elevate-square-white.png",
  full: "/logo-elevate-white.png",
};

const LIGHT_LOGOS = {
  square: "/logo-elevate-square-black.png",
  full: "/logo-elevate-black.png",
};

// Refs e stores
const mode: any = useColorMode();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

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
const star = ref<number>(0)
const feedback = ref<string>("");
const loading = ref(false);
const file = ref<File>();
const messageContainerRef = ref<HTMLElement | null>(null);
const isAnimating = ref(false);
const isInputDisabled = computed(() => loading.value || isAnimating.value);
const suggestionList = ref([]);

// Computed
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const logoInChat = computed(() => getLogoSrc(mode.value === "dark", false));

const iconIa = computed(() => {
  return mode.value === "dark"
    ? "/logo-elevate-square-white.png"
    : "/logo-elevate-square-black.png";
});

// Methods
const handleSidebarAiExpand = () => {
  emit("update:sidebarAi", false);
};

const scrollToBottom = () => {
  nextTick(() => {
    const container = messageContainerRef.value;
    if (container) {
      messageContainerRef.value!.scrollTop = container.scrollHeight;
    }
  });
};

const getLogoSrc = (isDarkMode: boolean, isSidebarExpanded: boolean) => {
  const logos = isDarkMode ? DARK_LOGOS : LIGHT_LOGOS;
  return isSidebarExpanded ? logos.full : logos.square;
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

const sendFeed = async () => {
  try {
    const response = await IntelligenceArtificial.sendFeedback({
      chat_id: selectedChatId.value,
      feedback: feedback.value,
      score: star.value
    })
    toast({
      title: "Feedback",
      description:"Feedback enviado com sucesso!",
      duration: 2000
    })
  }catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
}

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
    const shouldBeOpen = localStorage.getItem("sidebarAi") === "1";
    emit("update:sidebarAi", shouldBeOpen);
  }
};

onMounted(async () => {
  const user = authStore.user;

  if (user) {
    await getSuggestions();
    await loadChats();
  }

  setTimeout(() => setOpenAi(), 100);
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
