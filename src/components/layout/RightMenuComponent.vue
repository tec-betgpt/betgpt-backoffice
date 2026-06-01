<template>
  <Sidebar
    class="ia z-20"
    side="right"
    variant="sidebar"
    collapsible="offcanvas"
    :collapsed="sidebarAi"
    :setOpen="setOpenAi"
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
                <Maximize2
                    :stroke-width="2"
                    class="cursor-pointer"
                    absoluteStrokeWidth
                    @click="router.push({ name: 'chat-ia', query: { chatId: selectedChatId } })"
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
                Expandir Chat
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
            v-if="analysisErrorMessage"
            class="h-full flex flex-col items-center justify-center w-full gap-4 px-6 text-center"
        >
          <Avatar class="h-4 w-4 rounded-lg">
            <AvatarImage :src="iconIa" />
            <AvatarFallback class="rounded-lg">
              {{ authStore.user?.initials }}
            </AvatarFallback>
          </Avatar>
          <TriangleAlert class="h-6 w-6 text-destructive" />
          <span class="text-xs text-muted-foreground">{{ analysisErrorMessage }}</span>
        </div>

        <div
            v-else-if="isLoadingChat || isLoadingLocal"
            class="h-full flex flex-col items-center justify-center w-full gap-4"
        >
          <Avatar class="h-4 w-4 rounded-lg">
            <AvatarImage :src="iconIa" />
            <AvatarFallback class="rounded-lg">
              {{ authStore.user?.initials }}
            </AvatarFallback>
          </Avatar>
          <div class="loading-dots">
            <span v-for="n in 3" :key="n" :style="{ animationDelay: `${n * 0.2}s` }">.</span>
          </div>
          <span class="text-xs text-muted-foreground animate-pulse">{{ loadingMessage }}</span>
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
              class="overflow-x-hidden overflow-y-auto h-full px-6 relative"
              @scroll="updateActiveChatDate"
          >
            <div
                v-if="messages.length"
                class="sticky top-2 z-10 flex justify-center pointer-events-none mb-4"
            >
              <Badge
                  class="text-foreground border shadow-sm backdrop-blur-sm transition-opacity duration-200"
                  :class="isDateDividerPinned ? 'bg-background/45 opacity-55' : 'bg-background/90 opacity-100'"
              >
                {{ activeChatDateLabel }}
              </Badge>
            </div>

            <template v-for="(message, index) in messages" :key="message.id ?? index">
              <div
                  v-if="shouldShowDateDivider(index)"
                  data-date-divider
                  class="flex items-center gap-3 my-6 text-[11px] font-medium text-muted-foreground"
              >
                <div class="h-px flex-1 bg-border"></div>
                <span class="rounded-full border bg-background px-3 py-1">
                  {{ formatChatDateLabel(message) }}
                </span>
                <div class="h-px flex-1 bg-border"></div>
              </div>

              <CustomTextChart
                  :data-message-date="getMessageDateKey(message)"
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
            </template>

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
              <span class="text-xs text-muted-foreground animate-pulse">{{ loadingMessage }}</span>
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
        <div class=" w-full flex items-center justify-end ">
          <CustomStarScore v-if="messages.length > 0" :readonly="false" :modelValue="star" @update:modelValue="args => star = args" >
            <form @submit.prevent="sendFeed" class="flex justify-end flex-col gap-2">
              <Textarea placeholder="Feedback" v-model="feedback"/>
              <Button >
                Enviar Feedback
              </Button>
            </form>

          </CustomStarScore>
        </div>

        <div class="relative w-full items-center">
          <div class="absolute end-0 flex  align-middle items-center justify-end w-28 h-full">
            <Button
                v-if="((!newMessage.message.trim() && !file) || isRecording) && SpeechRecognition "
                variant="link"
                @click="toggleRecording"
                class="relative"
                :class="{ 'text-red-600 hover:text-red-700': isRecording }"
            >
              <Square v-if="isRecording" class="h-5 w-5 fill-current" />
              <Mic v-else class="h-5 w-5" />
            </Button>
            <Button
                v-if="!isRecording"
                variant="link"
                @click="sendMessage"
                :disabled="isInputDisabled"
                class="relative"
            >
              <SendHorizontal :stroke-width="2.5" absoluteStrokeWidth />
            </Button>


          </div>


          <span
              v-if="!isRecording"
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
              v-if="!isRecording"
              id="search"
              @keyup.enter="!isInputDisabled && sendMessage()"
              v-model="newMessage.message"
              type="text"
              placeholder="Pergunte alguma coisa"
              class="px-10 h-12"
          />

          <!-- Recording Animation State -->
          <div v-else class="flex items-center justify-center gap-4 h-12 px-2 border rounded-md bg-background">
            <div class="flex items-center gap-1.5 h-full">
              <div
                  v-for="i in 8"
                  :key="i"
                  class="w-1 bg-yellow-500 rounded-full transition-all duration-75 origin-center"
                  :style="{
                    height: `${Math.max(4, audioLevel * (15 + (i % 4) * 10))}px`,
                    opacity: 0.4 + (audioLevel * 0.6)
                  }"
              ></div>
            </div>
            <span class="text-xs text-muted-foreground w-full text-center">
               {{ audioLevel > 0.1 ? 'Detectando fala...' : 'Silêncio...' }}
             </span>
          </div>
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
  Maximize2,
  Mic,
  Square,
  TriangleAlert
} from "lucide-vue-next";
import { useColorMode } from "@vueuse/core";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import { Label } from "@/components/ui/label";
import { marked } from "marked";
import { computed, nextTick, onMounted, onUnmounted, ref, toRefs, watch } from "vue";
import {useRoute, useRouter} from "vue-router";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import CustomTextChart from "@/components/custom/CustomTextChart.vue";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CustomStarScore from "@/components/custom/CustomStarScore.vue";
import {Textarea} from "@/components/ui/textarea";
import { useIAAnaliseStore } from "@/stores/iaAnalise";

interface Chat {
  id: number;
  title: string;
}
interface Message {
  id: number | undefined;
  role: "user" | "assistant";
  message: string;
  file: File | null;
  timestamp?: string;
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
const router = useRouter();
const iaAnaliseStore = useIAAnaliseStore();

// Chat e mensagens
const chats = ref<Chat[]>([]);
const isLoadingLocal = ref(false);
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
const activeChatDateLabel = ref("");
const isDateDividerPinned = ref(false);
const isAnimating = ref(false);
const isInputDisabled = computed(() => loading.value || isAnimating.value);
const suggestionList = ref([]);
const analysisErrorMessage = ref("");

// Audio Recording State
const isRecording = ref(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const audioLevel = ref(0);
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let animationFrame: number | null = null;
let recognition: any = null;
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const onMouseEnter = () => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    sidebarAi.value = true;
  }
};

const onMouseLeave = () => {
  const isMobile = window.innerWidth < 768;
  if (!isMobile) {
    sidebarAi.value = false;
  }
};
// Audio Recording Methods
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
};

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Audio Analysis Setup
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      audioLevel.value = average / 100;
      animationFrame = requestAnimationFrame(updateLevel);
    };
    updateLevel();

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
           newMessage.value.message = (newMessage.value.message ? newMessage.value.message + ' ' : '') + finalTranscript;
        }
      };

      recognition.start();
    }

    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = async () => {
      audioChunks.value = [];
      isRecording.value = false;
      
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioContext) audioContext.close();
      if (recognition) recognition.stop();
      
      analyser = null;
      audioLevel.value = 0;
      
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.value.start();
    isRecording.value = true;

  } catch (error) {
    console.error("Error accessing microphone:", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível acessar o microfone.' });
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
};

// Computed
const activeGroupProject = computed(
  () => workspaceStore.activeGroupProject || null
);

const isLoadingChat = computed(() => iaAnaliseStore.isLoading);

const loadingTexts = [
  "Analisando os dados...",
  "Estruturando KPIs...",
  "Refletindo sobre os dados...",
  "Construindo Relatorio...",
]
const loadingTextIndex = ref(0)
const loadingMessage = computed(() => loadingTexts[loadingTextIndex.value])

let loadingTextInterval: ReturnType<typeof setInterval> | null = null

const startLoadingTextCycle = () => {
  loadingTextIndex.value = 0
  loadingTextInterval = setInterval(() => {
    loadingTextIndex.value = (loadingTextIndex.value + 1) % loadingTexts.length
  }, 3000)
}

const stopLoadingTextCycle = () => {
  if (loadingTextInterval) {
    clearInterval(loadingTextInterval)
    loadingTextInterval = null
  }
}

watch([isLoadingChat, isLoadingLocal, loading], ([chatLoading, localLoading, msgLoading]) => {
  if (chatLoading || localLoading || msgLoading) {
    startLoadingTextCycle()
  } else {
    stopLoadingTextCycle()
  }
})

watch(() => iaAnaliseStore.error, (errorMessage) => {
  if (!errorMessage) return;

  analysisErrorMessage.value = errorMessage;
  iaAnaliseStore.chatId = null;
  iaAnaliseStore.error = null;
})

watch(() => iaAnaliseStore.isLoading, async (newVal, oldVal) => {
  if (oldVal === true && newVal === false && iaAnaliseStore.chatId) {
    selectedChatId.value = parseInt(iaAnaliseStore.chatId);
    localStorage.setItem("chatId", iaAnaliseStore.chatId);
    await loadMessages();
  }
});

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
      updateActiveChatDate();
    }
  });
};

const getDateKey = (date = new Date()) => date.toLocaleDateString("sv-SE");

const getMessageDateKey = (message: Message) => {
  const date = new Date((message.timestamp ?? "").replace(" ", "T"));

  return getDateKey(Number.isNaN(date.getTime()) ? new Date() : date);
};

const getDateLabelFromKey = (dateKey: string) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === getDateKey()) return "Hoje";
  if (dateKey === getDateKey(yesterday)) return "Ontem";

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR");
};

const formatChatDateLabel = (message: Message) => getDateLabelFromKey(getMessageDateKey(message));

const shouldShowDateDivider = (index: number) => {
  const currentMessage = messages.value[index];
  const previousMessage = messages.value[index - 1];

  return !previousMessage || getMessageDateKey(currentMessage) !== getMessageDateKey(previousMessage);
};

const updateActiveChatDate = () => {
  const container = messageContainerRef.value;

  if (!container || !messages.value.length) {
    activeChatDateLabel.value = "";
    isDateDividerPinned.value = false;
    return;
  }

  const messageElements = Array.from(
    container.querySelectorAll<HTMLElement>("[data-message-date]")
  );

  if (!messageElements.length) {
    isDateDividerPinned.value = false;
    return;
  }

  let activeDateKey = messageElements[0].dataset.messageDate || getMessageDateKey(messages.value[0]);

  for (const element of messageElements) {
    if (element.offsetTop <= container.scrollTop + 72) {
      activeDateKey = element.dataset.messageDate || activeDateKey;
    } else {
      break;
    }
  }

  isDateDividerPinned.value = Array.from(container.querySelectorAll<HTMLElement>("[data-date-divider]")).some((element) => {
    const top = element.offsetTop - container.scrollTop;

    return top >= 0 && top <= 64;
  });
  activeChatDateLabel.value = getDateLabelFromKey(activeDateKey);
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
    // 
  }
};

const createNewChat = async () => {
  try {
    const response = await IntelligenceArtificial.createSession({project_id:activeGroupProject.value.project_id});
    selectedChatId.value = response.data.id;
  } catch (error) {
    console.error("Erro ao criar chat:", error);
  }
};

const selectChat = async (chatId: number) => {
  if (chatId == 0) return;

  analysisErrorMessage.value = "";
  isLoadingLocal.value = true;
  selectedChatId.value = chatId;
  localStorage.setItem("chatId", `${chatId}`);
  await loadMessages();
  isLoadingLocal.value = false;
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
      timestamp: message.timestamp,
    }));
    scrollToBottom();
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
  } finally {
    loading.value = false;
  }
};
const route = useRoute();

const sendMessage = async () => {
  analysisErrorMessage.value = "";

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
      context:{
        url:route.path,
        date: workspaceStore.date,
        context: workspaceStore.context,
      }
    };
    loading.value = true;
    newMessage.value.id = messages.value.length;
    newMessage.value.timestamp = new Date().toISOString();
    try {
      messages.value.push({ ...newMessage.value });
      scrollToBottom();

      newMessage.value = { id: 0, role: "user", message: "", file: null };
      const response = await IntelligenceArtificial.sendMessage(userMessage);
      file.value = undefined;
      const assistantMessage: Message = {
        id: messages.value.length,
        role: "assistant",
        message: await marked.parse(response.data.message),
        file: null,
        timestamp: response.data.timestamp,
      };

      messages.value.push(assistantMessage);
      scrollToBottom();
      loading.value = false;
      isAnimating.value = true;
    } catch (error) {
      console.error("Erro ao enviar mensagem: "+error);
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
  analysisErrorMessage.value = "";
  selectedChatId.value = undefined;
  localStorage.removeItem("chatId");
  messages.value = [];
  activeChatDateLabel.value = "";
  isDateDividerPinned.value = false;
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

onUnmounted(() => {
  stopLoadingTextCycle()
})

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
