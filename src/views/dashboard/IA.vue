<script setup lang="ts">

import axios from "axios";
import { Button } from "@/components/ui/button";
import { Plus ,X,Trash2,ChevronRight,File} from 'lucide-vue-next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {nextTick, onMounted, ref} from 'vue'
import {computed} from 'vue';
import {Label} from "@/components/ui/label";
import {Sheet, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Separator} from "@/components/ui/separator";


const chats = ref<Chat[]>([
    {id: 1, title: "Chat 1"},
  {id: 2, title: "Chat 2"},
  {id: 3, title: "Chat 3"}])
const selectedChatId = ref()
const selectedModel = ref('openai')
const messages = ref<Message[]>([])
messages.value = Array.from({length: 15}, (_, index) => ({
  id: index + 1,
  sender: index % 2 === 0 ? 'user' : 'assistant',
  content: `Mensagem de exemplo ${index + 1}`,
  iaModel: 'openai',
  file: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
const newMessage = ref('')
const uploadProgress = ref(0)
const file = ref(null)
const loading = ref(false)
const showNewChatModal = ref(false)
const newChatTitle = ref('')
const uploadedFilePath = ref(null)
const fileInputRef = ref()
const messageContainerRef = ref(null)
interface Chat {
  id: number;
  title: string;
}

interface Message {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  iaModel: string;
  file: string | null;
  createdAt: string;
  updatedAt: string;
}


async function loadChats() {
  try {
    const response = await axios.get(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/list`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    chats.value = response.data.chats;
    if (chats.value.length > 0 && !selectedChatId.value) {
      selectedChatId.value = chats.value[0].id;
      await loadMessages();
    }
  } catch (error) {
    console.error("Erro ao carregar chats:", error);
  }
}

async function createNewChat() {
  if (!newChatTitle.value) return;

  try {
    const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/create`,
        {title: newChatTitle.value},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
    );

    chats.value.push(response.data.chat);
    selectedChatId.value = response.data.chat.id;

    newChatTitle.value = "";
  } catch (error) {
    console.error("Erro ao criar chat:", error);
  }finally {
    showNewChatModal.value = false;
  }
}

async function deleteChat(chatId: number) {
  if (!confirm("Tem certeza que deseja excluir este chat?")) return;

  try {
    await axios.delete(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${chatId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    chats.value = chats.value.filter((c) => c.id !== chatId);
    if (selectedChatId.value === chatId) {
      selectedChatId.value = chats.value.length > 0 ? chats.value[0].id : null;
    }
  } catch (error) {
    console.error("Erro ao excluir chat:", error);
  }
}

async function selectChat(chatId: number) {
  selectedChatId.value = chatId;
  await loadMessages();
}

async function loadMessages() {
  if (!selectedChatId.value) return;

  try {
    const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${selectedChatId.value}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
    );

    messages.value = response.data.messages;
    scrollToBottom();
  } catch (error) {
    console.error("Erro ao carregar mensagens:", error);
  }
}

function extractFileName(url: string): string {
  return url.split("/").pop() || "";
}

async function sendMessage() {
  if (!newMessage.value && !uploadedFilePath.value) return;

  const userMessage: Message = {
    sender: "user",
    content: newMessage.value,
    iaModel: selectedModel.value,
    file: uploadedFilePath.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  loading.value = true;
  try {
    messages.value.push(userMessage);
    scrollToBottom();

    const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${selectedChatId.value}/message`,
        userMessage,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
    );

    const assistantMessage: Message = {
      sender: "assistant",
      content: response.data.response,
      iaModel: selectedModel.value,
      file: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    messages.value.push(assistantMessage);
    scrollToBottom();

    newMessage.value = "";
    uploadedFilePath.value = null;
    if (fileInputRef.value) fileInputRef.value.value = "";
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  } finally {
    loading.value = false;
  }
}

function triggerFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files ? input.files[0] : null;
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
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
            );
          },
        }
    );
    uploadProgress.value = 0;

    uploadedFilePath.value = response.data.fileUrl;
  } catch (error) {
    console.error("Erro no upload do arquivo:", error);
    alert("Erro ao enviar arquivo");
  }
}

function scrollToBottom() {
  nextTick(() => {
    const container = messageContainerRef.value;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  });
}

onMounted(() => {
  loadChats();
});


const selectedChatTitle = computed(() => {
  const chat = chats.value.find((chat) => chat.id === selectedChatId.value);
  return chat ? chat.title : null;
});
</script>

<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
    <div class="space-y-0.5">
      <h2 class="text-2xl font-bold tracking-tight">Elevate IA</h2>
      <p class="text-muted-foreground">
        Converse sobre estratégias para aprimorar receitas, lucros e outras métricas importantes.
      </p>
    </div>
    <Card class="">
      <CardHeader>
        <Select v-model="selectedModel">
          <SelectTrigger class="sm:w-[240px] w-full">
            <SelectValue :placeholder="selectedModel || 'Selecione um Modelo'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="deepseek">DeepSeek</SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="selectedChatId">
          <SelectTrigger class="sm:w-[240px] w-full md:hidden">
            <SelectValue :placeholder="selectedChatTitle || 'Selecione um chat'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem  v-for="chat in chats" :key="chat.id" :value="chat.title">
              {{ chat.title }}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent class="flex justify-center items-center gap-4">
        <Card class="min-w-52 max-w-52 overflow-y-auto md:block hidden min-h-[600px] ">
         <CardHeader>
           <div class="flex justify-between items-center mb-6">
             <h2 class=" text-xl font-bold">Chats IA</h2>
             <Button
                 @click="showNewChatModal = true"
                 title="Novo Chat"
                 size="icon"
             >
               <Plus/>
             </Button>
           </div>
         </CardHeader>
          <CardContent class="flex flex-col gap-2">
            <div
                v-for="chat in chats"
                :key="chat.id"
                @click="selectChat(chat.id)"
                class="flex items-center justify-between px-4 py-2 cursor-pointer rounded-md border-2"
                :class="{

              'bg-gray-400': selectedChatId === chat.id,
              'hover:bg-gray-200': selectedChatId !== chat.id
            }"
            >
              <span class=" truncate text-sm">{{ chat.title }}</span>
              <Button
                  @click.stop="deleteChat(chat.id)"
                  variant="ghost"
                  title="Excluir chat"
              >
                <Trash2 :stroke-width="1.5" absoluteStrokeWidth />
              </Button>

            </div>
          </CardContent>

        </Card>
        <div class="flex flex-1 min-h-[600px] flex-col justify-between ">
          <div class="flex flex-1 flex-col overflow-y-auto gap-3 max-h-[600px] ">
            <div
                v-for="message in messages"
                :key="message.id"
                :class="message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'"
            >
              <Badge
                  :class="[
                'p-3 rounded-lg mx-1 max-w-[80%] lg:max-w-[60%] shadow-md transition-all ',
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border text-gray-800'
              ]"
              >
                <p class="sm:text-sm text-xs font-medium break-words">{{ message.content }}</p>
                <a
                    v-if="message.file"
                    :href="message.file"
                    target="_blank"
                    class="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300 underline break-words"
                >
                  📎 {{ extractFileName(message.file) }}
                </a>
              </Badge>

            </div>
          </div>
          <div class="flex gap-3 items-center justify-center pt-4" >
            <div>
              <Label for="file">
                <File />
              </Label>
              <Input id="file" type="file" class="hidden" :ref="fileInputRef" @change="handleFileUpload"/>
<!--              <Button-->
<!--                  @click="triggerFileInput"-->
<!--                  variant="outline"-->
<!--                  size="icon"-->
<!--                  class="p-2 text-gray-600 hover:text-blue-500 transition-colors"-->
<!--                  title="Anexar arquivo"-->
<!--                  :disabled="uploadProgress>0 && !uploadedFilePath"-->
<!--              >-->
<!--                <div v-if="uploadProgress > 0" class="text-sm ">-->
<!--                  {{ uploadProgress }}%-->
<!--                </div>-->
<!--                <div v-else>-->
<!--                  📎-->
<!--                </div>-->

<!--              </Button>-->
            </div>

            <Input v-model="newMessage" placeholder="Digite sua mensagem" @keyup.enter="sendMessage" />
            <Button @click="sendMessage" :disabled="loading">
              <ChevronRight class="sm:hidden" />
              <p class="sm:block hidden">Enviar mensagem</p>
            </Button>
          </div>
        </div>


      </CardContent>

    </Card>
  </div>

  <!-- Sheet para Criação de Chat -->
  <Sheet
      v-model:open="showNewChatModal"
      position="right"
      size="sm"
      title="Novo Chat"
  >

    <SheetContent>
      <SheetHeader>
        <SheetTitle>Criar Chat</SheetTitle>
      </SheetHeader>
      <div class="space-y-4 p-4">
        <Label for="chatTitle">Título do Chat</Label>
        <Input
            id="chatTitle"
            v-model="newChatTitle"
            placeholder="Digite o título do chat"
        />
        <Button @click="createNewChat" :disabled="!newChatTitle.trim()" class="w-full">
          Criar Chat
        </Button>
      </div>
    </SheetContent>

  </Sheet>

</template>


<style scoped>

</style>