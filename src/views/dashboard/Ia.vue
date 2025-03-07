<template>
  <div class="space-y-6 p-10 max-[450px]:p-2 pb-16 w-full">
  <div class="space-y-0.5"><h2 class="text-2xl font-bold tracking-tight">Elevate IA</h2>
    <p class="text-muted-foreground">
      Converse sobre estratégias para aprimorar receitas, lucros e outras métricas importantes.
    </p>
  </div>
  <Card>
    <CardHeader>
      <Select v-model="selectedModel">
        <SelectTrigger class="sm:w-[240px] w-full">
          <SelectValue :placeholder="selectedChatTitle || 'Selecione um chat'" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="gemini">Gemini</SelectItem>
          <SelectItem value="claude">Claude</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>

    <CardContent class="flex justify-center items-center gap-4">
      <Card class="min-w-52 overflow-y-auto space-y-2 sm:block hidden min-h-[600px] bg-gray-900 py-1">
        <CardContent>
          <div
              v-for="chat in chats"
              :key="chat.id"
              @click="selectChat(chat.id)"

              :class="{
              'bg-gray-700': selectedChatId === chat.id,
              'hover:bg-gray-600': selectedChatId !== chat.id
            }"
          >
            <span class="text-white truncate text-sm">{{ chat.title }}</span>
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
      <div class="flex flex-1 max-h-[600px] flex-col">
        <div class="flex flex-1 flex-col overflow-y-auto gap-3  ">
          <div
              v-for="message in messages"
              :key="message.id"
              :class="message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'"
          >
            <Badge
                :class="[
                'p-3 rounded-lg max-w-[80%] lg:max-w-[60%] shadow-sm transition-all ',
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border text-gray-800'
              ]"
            >
              <p class="text-sm font-medium break-words">{{ message.content }}</p>
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
            <input type="file" class="hidden"  ref="fileInput" @change="handleFileUpload"/>
            <Button
                @click="triggerFileInput"
                variant="outline"
                size="icon"
                class="p-2 text-gray-600 hover:text-blue-500 transition-colors"
                title="Anexar arquivo"
                :disabled="uploadProgress>0 && !uploadedFilePath"
            >
              <div v-if="uploadProgress > 0" class="text-sm ">
               {{ uploadProgress }}%
              </div>
              <div v-else>
                📎
              </div>

            </Button>
          </div>

          <Input v-model="newMessage" placeholder="Digite sua mensagem" @keyup.enter="sendMessage" />
          <Button @click="sendMessage" :disabled="loading">
              <ChevronRight v-if="window.innerWidth < 600"/>
              <p v-else>Enviar mensagem</p>
          </Button>
        </div>
      </div>


    </CardContent>

  </Card>
  </div>
    </template>
  
  <script >
  import axios from "axios";
  import { Button } from "@/components/ui/button";
  import { Plus ,X,Trash2,ChevronRight} from 'lucide-vue-next';
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
  import {Sidebar, SidebarProvider,SidebarHeader} from "@/components/ui/sidebar";
  import {Badge} from "@/components/ui/badge";

  export default {
    components: {
      ChevronRight,
      Badge,
      Trash2,
      X,
      SidebarHeader,
      Sidebar,
      SidebarProvider,
      Input,
      CardFooter,
      SelectContent, SelectTrigger, SelectItem, Select,SelectValue,SelectLabel, CardTitle, CardHeader, CardContent, Card,Button,Plus},
    data() {
      return {
        chats: [
          {id: 1, title: "Chat 1"},
          {id: 2, title: "Chat 2"},
          {id: 3, title: "Chat 3"}
        ],
        selectedChatId: null,
        selectedModel: "openai",
        messages: [
          {
            id: 1,
            sender: "user",
            content: "Olá! Como você está?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:00:00.000Z",
            updatedAt: "2023-10-30T10:00:00.000Z",
          },
          {
            id: 2,
            sender: "assistant",
            content: "Olá! Estou aqui para ajudá-lo! Como posso assisti-lo hoje?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:01:00.000Z",
            updatedAt: "2023-10-30T10:01:00.000Z",
          },
          {
            id: 3,
            sender: "user",
            content: "Qual é a previsão do tempo para hoje?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:05:00.000Z",
            updatedAt: "2023-10-30T10:05:00.000Z",
          },
          {
            id: 4,
            sender: "assistant",
            content: "Hoje está ensolarado com temperaturas em torno de 25°C.",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:06:00.000Z",
            updatedAt: "2023-10-30T10:06:00.000Z",
          },
          {
            id: 5,
            sender: "user",
            content: "Pode me recomendar um restaurante?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:10:00.000Z",
            updatedAt: "2023-10-30T10:10:00.000Z",
          },
          {
            id: 6,
            sender: "assistant",
            content: "Claro! Experimente o Restaurante Sabor Gourmet, conhecido pela culinária deliciosa.",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:11:00.000Z",
            updatedAt: "2023-10-30T10:11:00.000Z",
          },
          {
            id: 7,
            sender: "user",
            content: "Qual é a cotação do dólar hoje?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:15:00.000Z",
            updatedAt: "2023-10-30T10:15:00.000Z",
          },
          {
            id: 8,
            sender: "assistant",
            content: "A cotação atual do dólar é R$5,35.",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:16:00.000Z",
            updatedAt: "2023-10-30T10:16:00.000Z",
          },
          {
            id: 9,
            sender: "user",
            content: "Pode me ajudar a criar uma lista de compras?",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:20:00.000Z",
            updatedAt: "2023-10-30T10:20:00.000Z",
          },
          {
            id: 10,
            sender: "assistant",
            content: "Claro, me diga o que você precisa incluir na lista.",
            iaModel: "openai",
            file: null,
            createdAt: "2023-10-30T10:21:00.000Z",
            updatedAt: "2023-10-30T10:21:00.000Z",
          },
        ],
        newMessage: "",
        uploadProgress: 0,
        file: null,
        loading: false,
        showNewChatModal: false,
        newChatTitle: "",
        uploadedFilePath: null
      };
    },
    computed: {
      selectedChatTitle() {
        const chat = this.chats.find(c => c.id === this.selectedChatId);
        return chat ? chat.title : "";
      }
    },
    methods: {
        async loadChats() {
            try {
            const response = await axios.get(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/list`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            this.chats = response.data.chats;
            if (this.chats.length > 0 && !this.selectedChatId) {
                this.selectedChatId = this.chats[0].id;
                await this.loadMessages();
            }
            } catch (error) {
                console.error("Erro ao carregar chats:", error);
            }
        },

        async createNewChat() {
            if (!this.newChatTitle) return;

            try {
            const response = await axios.post(
                `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/create`,
                { title: this.newChatTitle },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            this.chats.push(response.data.chat);
            this.selectedChatId = response.data.chat.id;
            this.showNewChatModal = false;
            this.newChatTitle = "";
            } catch (error) {
                console.error("Erro ao criar chat:", error);
            }
        },

        async deleteChat(chatId) {
            if (!confirm("Tem certeza que deseja excluir este chat?")) return;

            try {
                await axios.delete(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${chatId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                this.chats = this.chats.filter(c => c.id !== chatId);
                if (this.selectedChatId === chatId) {
                    this.selectedChatId = this.chats.length > 0 ? this.chats[0].id : null;
                }
            } catch (error) {
                console.error("Erro ao excluir chat:", error);
            }
        },

        async selectChat(chatId) {
            this.selectedChatId = chatId;
            await this.loadMessages();
        },

        async loadMessages() {
            if (!this.selectedChatId) return;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
            );
            this.messages = response.data.messages;
            this.scrollToBottom();
            } catch (error) {
                console.error("Erro ao carregar mensagens:", error);
            }
        },

        extractFileName(url) {
            return url.split("/").pop();
        },
        async sendMessage() {
            if (!this.newMessage && !this.uploadedFilePath) return;

            const userMessage = {
                sender: "user",
                content: this.newMessage,
                iaModel: this.selectedModel,
                file: this.uploadedFilePath,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            this.loading = true;
            try {
                this.messages.push(userMessage);
                this.scrollToBottom();

                const response = await axios.post(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/message`, userMessage, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                const assistantMessage = {
                    sender: "assistant",
                    content: response.data.response,
                    iaModel: this.selectedModel,
                    file: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                this.messages.push(assistantMessage);
                this.scrollToBottom();

                this.newMessage = "";
                this.uploadedFilePath = null;
                this.$refs.fileInput.value = "";
            } catch (error) {
                console.error("Erro ao enviar mensagem:", error);
            } finally {
                this.loading = false;
            }
        },
        triggerFileInput() {
            this.$refs.fileInput.click();
        },

        async handleFileUpload(event) {
            const file = event.target.files[0];
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
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        },
                        onUploadProgress: (progressEvent) => {
                            this.uploadProgress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                            );
                        }
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
                const container = this.$refs.messageContainer;
                container.scrollTop = container.scrollHeight;
            });
        },
        },

        mounted() {
            this.loadChats();
        }
    };
  </script>