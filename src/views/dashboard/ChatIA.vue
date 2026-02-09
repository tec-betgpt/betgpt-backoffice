<template>
  <div class="flex h-[calc(100vh-6rem)] w-full overflow-hidden bg-background rounded-lg border shadow-sm">
    <!-- Sidebar List -->
    <aside
      class="flex flex-col border-r bg-muted/10 transition-all duration-300"
      :class="[
        isMobile ? (isSidebarOpen ? 'absolute inset-y-0 left-0 z-50 w-80 bg-background shadow-2xl' : 'hidden') : 'w-80'
      ]"
    >
      <div class="flex h-16 items-center justify-between border-b px-4">
        <h2 class="text-lg font-semibold tracking-tight">Histórico</h2>
        <Button variant="ghost" size="icon" @click="createNewChat" title="Novo Chat">
          <SquarePen class="h-5 w-5" />
        </Button>
      </div>

      <div class="p-4">
        <Button @click="createNewChat" class="w-full justify-start gap-2" variant="default">
          <Plus class="h-4 w-4" />
          Novo Chat
        </Button>
      </div>

      <ScrollArea class="flex-1 px-3">
        <div v-if="loadingChats" class="space-y-2 p-2">
          <Skeleton v-for="n in 5" :key="n" class="h-12 w-full rounded-lg" />
        </div>
        <div v-else-if="chats.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          Nenhum histórico encontrado.
        </div>
        <div v-else class="space-y-1 p-1">
          <div
            v-for="chat in chats"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
            :class="{ 'bg-accent text-accent-foreground font-medium': selectedChatId === chat.id }"
          >
            <div class="flex items-center gap-3 overflow-hidden">
              <MessageSquare class="h-4 w-4 flex-shrink-0" />
              <span class="truncate">{{ chat.title || 'Nova conversa' }}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="deleteChat(chat.id)"
            >
              <Trash2 class="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>

    <!-- Overlay for mobile sidebar -->
    <div
      v-if="isMobile && isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Main Chat Area -->
    <main class="flex flex-1 flex-col min-w-0 bg-background relative">
      <!-- Header -->
      <header class="flex h-16 items-center justify-between border-b px-6">
        <div class="flex items-center gap-4">
          <Button v-if="isMobile" variant="ghost" size="icon" @click="isSidebarOpen = true">
            <Menu class="h-5 w-5" />
          </Button>
          <div>
            <h1 class="text-lg font-semibold flex items-center gap-2">
              <Brain class="h-5 w-5 text-primary" />
              Elevate Brain
            </h1>
            <p class="text-xs text-muted-foreground hidden sm:block">
              Assistente inteligente para análise e estratégias.
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
           <DropdownMenu v-if="selectedChatId">
            <DropdownMenuTrigger as-child>
               <Button variant="ghost" size="icon">
                <MoreVertical class="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="deleteChat(selectedChatId)" class="text-destructive">
                <Trash2 class="h-4 w-4 mr-2" />
                Excluir Conversa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <!-- Messages Area -->
      <div class="flex-1 overflow-hidden relative">
        <div ref="messageContainerRef" class="h-full overflow-y-auto p-4 sm:p-6 scroll-smooth">
          
          <!-- Empty State -->
          <div v-if="messages.length === 0 && !loadingMessages" class="h-full flex flex-col items-center justify-center space-y-8 text-center px-4">
            <div class="bg-primary/10 p-6 rounded-full">
              <Brain class="h-12 w-12 text-primary" />
            </div>
            <div class="space-y-2 max-w-md">
              <h3 class="text-xl font-semibold">Como posso ajudar hoje?</h3>
              <p class="text-sm text-muted-foreground">
                Faça perguntas sobre suas métricas, peça análises de dados ou gere insights para melhorar seus resultados.
              </p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
              <Button 
                v-for="(suggestion, index) in suggestionList.slice(0, 4)" 
                :key="index"
                variant="outline" 
                class="h-auto py-4 px-4 justify-start text-left whitespace-normal"
                @click="useSuggestion(suggestion)"
              >
                <Search class="h-4 w-4 mr-3 flex-shrink-0 text-muted-foreground" />
                <span class="text-xs">{{ suggestion }}</span>
              </Button>
            </div>
          </div>

          <!-- Loading Messages -->
          <div v-else-if="loadingMessages" class="flex flex-col justify-center items-center h-full space-y-4">
            <LoadingFakeComponent />
            <p class="text-sm text-muted-foreground animate-pulse">Carregando conversa...</p>
          </div>

          <!-- Messages List -->
          <div v-else class="space-y-6 pb-4">
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="flex w-full gap-3"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <!-- Avatar Assistant -->
              <Avatar v-if="message.role !== 'user'" class="h-8 w-8 mt-1 border">
                <AvatarImage src="/logo-elevate-square-black.png" class="dark:invert" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>

              <div class="flex flex-col gap-1 max-w-[85%] lg:max-w-[70%]">
                <div
                  class="rounded-2xl px-4 py-3 shadow-sm text-sm"
                  :class="[
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 border rounded-tl-none'
                  ]"
                >
                  <div v-if="message.role === 'user'" class="whitespace-pre-wrap break-words">{{ message.rawMessage }}</div>
                  
                  <CustomTextChart 
                    v-else
                    :html="message.message"
                    :start="isAnimating && index === messages.length - 1"
                    :speed="10"
                    @tick="scrollToBottom"
                    @done="onAnimationDone"
                  />
                  
                  <!-- File Attachment -->
                  <div v-if="message.file" class="mt-3 flex items-center gap-2 rounded-md bg-background/20 p-2 text-xs">
                    <Paperclip class="h-3 w-3" />
                    <span class="truncate max-w-[150px]">{{ message.file.name || 'Arquivo anexado' }}</span>
                  </div>
                </div>
                
                <!-- Timestamp or Status -->
                <span class="text-[10px] text-muted-foreground px-1" :class="message.role === 'user' ? 'text-right' : 'text-left'">
                  {{ message.role === 'user' ? 'Você' : 'Elevate Brain' }}
                </span>
              </div>

               <!-- Avatar User -->
               <Avatar v-if="message.role === 'user'" class="h-8 w-8 mt-1 border">
                <AvatarFallback>{{ authStore.user?.initials || 'U' }}</AvatarFallback>
              </Avatar>
            </div>

            <!-- Loading Indicator for new message -->
            <div v-if="sendingMessage" class="flex w-full gap-3 justify-start">
               <Avatar class="h-8 w-8 mt-1 border">
                <AvatarImage src="/logo-elevate-square-black.png" class="dark:invert" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div class="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                 <span class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Footer / Input Area -->
      <footer class="p-4 border-t bg-background/80 backdrop-blur-sm">
        <div class="relative max-w-4xl mx-auto flex items-end gap-2 bg-muted/30 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-ring/20 transition-all">
          <Popover>
            <PopoverTrigger as-child>
               <Button variant="ghost" size="icon" class="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-lg">
                <Paperclip class="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-2" align="start">
               <Label
                  for="file-upload"
                  class="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer text-sm font-medium"
                >
                  <Upload class="h-4 w-4" />
                  Carregar arquivo
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  class="hidden"
                  @change="handleFileUpload"
                  :disabled="isInputDisabled"
                />
            </PopoverContent>
          </Popover>

          <div v-if="attachedFile" class="absolute -top-12 left-0 bg-background border p-2 rounded-md shadow-sm flex items-center gap-2 text-sm z-10">
            <span class="truncate max-w-[200px]">{{ attachedFile.name }}</span>
            <Button variant="ghost" size="icon" class="h-4 w-4 rounded-full" @click="attachedFile = null">
              <X class="h-3 w-3" />
            </Button>
          </div>

          <div v-if="!isRecording" class="flex-1 flex items-end gap-2">
            <Textarea
              v-model="newMessage"
              placeholder="Digite sua mensagem..."
              class="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none bg-transparent focus-visible:ring-0 px-2 py-2.5 flex-1"
              @keydown.enter.prevent="handleEnterKey"
              :disabled="isInputDisabled"
              ref="textareaRef"
            />
          </div>

          <!-- Recording Animation State -->
          <div v-else class="flex-1 flex items-center justify-center gap-4 h-[40px] px-2">
             <div class="flex items-center gap-1.5 h-full">
                <!-- Reative Golden Waveform -->
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
             <span class="text-xs text-muted-foreground">
               {{ audioLevel > 0.1 ? 'Detectando fala...' : 'Silêncio detectado...' }}
             </span>
          </div>

          <div class="flex gap-1">
             <Button
              v-if=" ((!newMessage.trim() && !attachedFile) || isRecording) && SpeechRecognition "
              size="icon"
              variant="ghost"
              class="h-10 w-10 shrink-0 rounded-lg transition-all hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
              @click="toggleRecording"
              :class="{ 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400': isRecording }"
              :title="isRecording ? 'Parar gravação' : 'Gravar áudio'"
            >
              <Square v-if="isRecording" class="h-5 w-5 fill-current" />
              <Mic v-else class="h-5 w-5" />
            </Button>

            <Button 
              v-if="!isRecording"
              size="icon" 
              :disabled="(!newMessage.trim() && !attachedFile) || isInputDisabled" 
              @click="sendMessage"
              class="h-10 w-10 shrink-0 rounded-lg transition-all"
              :class="{ 'opacity-50 cursor-not-allowed': (!newMessage.trim() && !attachedFile) || isInputDisabled }"
            >
              <SendHorizontal class="h-5 w-5" />
            </Button>
          </div>
        </div>

        <!-- Rating Trigger (Below Input) -->
        <div v-if="messages.length > 0 && !loadingMessages && !sendingMessage" class="max-w-4xl mx-auto mt-2 flex justify-start">
          <Popover>
            <PopoverTrigger as-child>
               <Button 
                variant="ghost" 
                size="sm" 
                class="h-auto p-0 text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                title="Avaliar conversa"
              >
                <span class="underline underline-offset-2">Avalie essa conversa</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" class="w-auto p-4 shadow-xl border-2">
               <div class="flex flex-col gap-3">
                 <h4 class="font-medium leading-none text-sm">Como foi a resposta?</h4>
                 <CustomStarScore :readonly="false" v-model="currentRating" />
                 <form @submit.prevent="submitFeedback" class="flex flex-col gap-2">
                    <Input v-model="feedbackText" class="h-8 text-xs min-w-[200px]" placeholder="Algum comentário extra?" />
                    <Button size="sm" type="submit" class="h-8 text-xs w-full font-semibold">Enviar Feedback</Button>
                 </form>
               </div>
            </PopoverContent>
          </Popover>
        </div>

        <div class="text-center mt-2">
            <p class="text-[10px] text-muted-foreground">O Elevate Brain pode cometer erros. Considere verificar informações importantes.</p>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";
import IntelligenceArtificial from "@/services/intelligenceArtificial";
import { marked } from "marked";
import { useToast } from "@/components/ui/toast/use-toast";
import { useWindowSize } from '@vueuse/core';
import { useRoute } from 'vue-router';

// UI Components
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Skeleton} from '@/components/ui/skeleton';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Label} from '@/components/ui/label';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import LoadingFakeComponent from "@/components/layout/LoadingFakeComponent.vue";
import CustomTextChart from "@/components/custom/CustomTextChart.vue";
import CustomStarScore from "@/components/custom/CustomStarScore.vue";

// Icons
import {
  Brain,
  Menu,
  MessageSquare,
  Mic,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  SendHorizontal,
  Square,
  SquarePen,
  Trash2,
  Upload,
  X
} from 'lucide-vue-next';

// Setup
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
const isSidebarOpen = ref(!isMobile.value);
const { toast } = useToast();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const activeGroupProject = computed(() => workspaceStore.activeGroupProject);
const route = useRoute();

// State
const chats = ref<Array<{id: number, title: string}>>([]);
const messages = ref<Array<any>>([]);
const suggestionList = ref<string[]>([]);
const selectedChatId = ref<number | null>(null);
const newMessage = ref('');
const attachedFile = ref<File | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const messageContainerRef = ref<HTMLElement | null>(null);

// Loading States
const loadingChats = ref(false);
const loadingMessages = ref(false);
const sendingMessage = ref(false);
const isAnimating = ref(false);

// Feedback State
const currentRating = ref(0);
const feedbackText = ref('');

// Computed
const isInputDisabled = computed(() => sendingMessage.value || isAnimating.value || loadingMessages.value);

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
    
    audioContext = new AudioContext({latencyHint:"playback"});
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
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
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Append only new final results or replace with interim if empty
        if (finalTranscript) {
           newMessage.value = (newMessage.value ? newMessage.value + ' ' : '') + finalTranscript;
        }
        // Note: Handling interim results strictly alongside existing text can be tricky in Vue without duplication
        // A simple approach is just updating the model, but for continuous dictation, we focus on final results 
        // to avoid text cursor jumping. If you want real-time preview in input, we can enhance this.
      };

      recognition.start();
    } else {
      console.warn("Web Speech API not supported in this browser.");
      toast({ variant: 'destructive', title: 'Erro', description: 'Navegador sem suporte.' });

    }

    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = async () => {
      // Audio is discarded as requested, only transcription is kept in newMessage.value
      audioChunks.value = []; 
      isRecording.value = false;
      
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioContext)  await audioContext.close();
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

// --- Methods ---

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainerRef.value) {
      messageContainerRef.value.scrollTop = messageContainerRef.value.scrollHeight;
    }
  });
};

const handleEnterKey = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    sendMessage();
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    attachedFile.value = target.files[0];
  }
};

const loadChats = async () => {
  loadingChats.value = true;
  try {
    const response = await IntelligenceArtificial.getListSessions();
    chats.value = response.data || [];
  } catch (error) {
    console.error("Failed to load chats", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar histórico de conversas.' });
  } finally {
    loadingChats.value = false;
  }
};

const loadSuggestions = async () => {
  try {
    const response = await IntelligenceArtificial.getSuggestions();
    suggestionList.value = response.data || [];
  } catch (error) {
    console.error("Failed to load suggestions", error);
  }
};

const selectChat = async (chatId: number) => {
  if (selectedChatId.value === chatId) return;
  
  selectedChatId.value = chatId;
  loadingMessages.value = true;
  isSidebarOpen.value = !isMobile.value; // Close sidebar on mobile
  messages.value = []; // Clear current messages
  currentRating.value = 0;
  feedbackText.value = '';

  try {
    const response = await IntelligenceArtificial.getSession({ chat_id: chatId });
    
    // Process messages
    messages.value = await Promise.all(response.data.map(async (msg: any) => ({
      id: msg.id,
      role: msg.role,
      rawMessage: msg.message[0] || '',
      message: await marked.parse(msg.message[0] || ''),
      file: null // The API response structure for files wasn't clear, assuming basic text for history for now
    })));
    
    scrollToBottom();
  } catch (error) {
    console.error("Failed to load messages", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar a conversa.' });
  } finally {
    loadingMessages.value = false;
  }
};

const createNewChat = async (select = true) => {
  try {
    const response = await IntelligenceArtificial.createSession({ project_id: activeGroupProject.value?.project_id });
    if (response.data) {
      chats.value.unshift(response.data);
      if (select === true || (typeof select === 'object' && select.type === 'click')) {
         await selectChat(response.data.id);
      }
      return response.data;
    }
  } catch (error) {
    console.error("Failed to create chat", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao iniciar nova conversa.' });
  }
};

const deleteChat = async (chatId: number) => {
  if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;
  
  try {
    await IntelligenceArtificial.deleteSession({ chat_id: chatId });
    chats.value = chats.value.filter(c => c.id !== chatId);
    if (selectedChatId.value === chatId) {
      selectedChatId.value = null;
      messages.value = [];
    }
    toast({ title: 'Conversa excluída com sucesso.' });
  } catch (error) {
    console.error("Failed to delete chat", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir conversa.' });
  }
};

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !attachedFile.value) || isInputDisabled.value) return;

  const content = newMessage.value;
  const file = attachedFile.value;
  
  // Reset input
  newMessage.value = '';
  attachedFile.value = null;
  
  // Optimistic UI update
  messages.value.push({
    role: 'user',
    rawMessage: content,
    message: content, // User message doesn't need markdown parsing usually
    file: file
  });
  
  scrollToBottom();

  let chatId = selectedChatId.value;

  if (!chatId) {
     // Create new chat but DO NOT select/wipe messages
     const newChat = await createNewChat(false);
     if (newChat) {
       chatId = newChat.id;
       selectedChatId.value = chatId;
     } else {
       // If creation failed, maybe show error and remove optimistic message?
       // For now, let's just return to avoid further errors
       return;
     }
  }

  sendingMessage.value = true;

  try {
    const response = await IntelligenceArtificial.sendMessage({
      chat_id: chatId,
      project_id: activeGroupProject.value?.id,
      message: content,
      file: file
    });

    const parsedResponse = await marked.parse(response.data.message);
    
    messages.value.push({
      role: 'assistant',
      rawMessage: response.data.message,
      message: parsedResponse
    });
    
    isAnimating.value = true;
    scrollToBottom();
  } catch (error) {
    console.error("Failed to send message", error);
    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao enviar mensagem.' });
    // Remove the optimistic message or show error state?
  } finally {
    sendingMessage.value = false;
  }
};

const useSuggestion = (text: string) => {
  newMessage.value = text;
  sendMessage();
};

const onAnimationDone = () => {
  isAnimating.value = false;
  scrollToBottom();
};

const submitFeedback = async () => {
  if(!selectedChatId.value) return;
  
  try {
    await IntelligenceArtificial.sendFeedback({
      chat_id: selectedChatId.value,
      score: currentRating.value,
      feedback: feedbackText.value
    });
    toast({ title: 'Obrigado!', description: 'Seu feedback foi enviado.' });
    feedbackText.value = '';
  } catch (error) {
    toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao enviar feedback.' });
  }
};

// Lifecycle
onMounted(async () => {
  if (activeGroupProject.value) {
    await Promise.all([loadChats(), loadSuggestions()]);
    
    if (route.query.chatId) {
      const chatId = Number(route.query.chatId);
      if (!isNaN(chatId)) {
        await selectChat(chatId);
      }
    }
  }
  
  // Check if routed with a specific chat ID (optional)
});

watch(() => isMobile.value, (mobile) => {
  if (!mobile) isSidebarOpen.value = true;
  else isSidebarOpen.value = false;
});

</script>

<style scoped>
/* Custom scrollbar for message area */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

/* Hide scrollbar for sidebar but keep functionality */
.scroll-area-viewport::-webkit-scrollbar {
  width: 4px;
}

@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(2); }
}
</style>