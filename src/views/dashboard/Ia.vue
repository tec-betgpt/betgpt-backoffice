<template>
    <div class="flex h-screen bg-gray-100 border-t">
      <!-- Sidebar de Chats -->
      <div class="w-64 bg-gray-800 p-4 overflow-y-auto flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-white text-xl font-bold">Chats IA</h2>
          <button 
            @click="showNewChatModal = true"
            class="p-2 text-blue-400 hover:text-blue-300 transition-colors"
            title="Novo Chat"
          >
            ➕
          </button>
        </div>
        
        <!-- Lista de Chats -->
        <div class="flex-1 overflow-y-auto space-y-2">
          <div
            v-for="chat in chats"
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
            :class="{
              'bg-gray-700': selectedChatId === chat.id,
              'hover:bg-gray-600': selectedChatId !== chat.id
            }"
          >
            <span class="text-white truncate text-sm">{{ chat.title }}</span>
            <button
              @click.stop="deleteChat(chat.id)"
              class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Excluir chat"
            >
              ×
            </button>
          </div>
        </div>
      </div>
  
      <!-- Área principal do Chat -->
      <div class="flex-1 flex flex-col">
        <!-- Header -->
        <div class="sticky top-0 z-10 bg-white shadow-sm">
          <div class="flex items-center justify-between p-4">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ selectedChatTitle || 'Selecione um chat' }}
            </h3>
            <select
              v-model="selectedModel"
              class="bg-gray-100 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="claude">Claude</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
        </div>
  
        <!-- Mensagens -->
        <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'"
          >
            <div
              :class="[
                'p-3 rounded-lg max-w-[80%] lg:max-w-[60%] shadow-sm transition-all',
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border text-gray-800'
              ]"
            >
              <p class="text-sm break-words">{{ message.content }}</p>
              <a
                v-if="message.file"
                :href="message.file"
                target="_blank"
                class="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300 underline break-words"
              >
                📎 {{ extractFileName(message.file) }}
              </a>
            </div>
          </div>
          
          <div v-if="loading" class="text-center text-gray-500 py-4">
            <div class="inline-flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
  
        <!-- Input de Mensagem -->
        <div class="sticky bottom-0 bg-white border-t p-4">
          <div class="flex items-center space-x-4">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              class="hidden"
              accept=".pdf,.doc,.docx,.txt, .jpg, .jpeg, .png, .xlsx, .xls"
            />
            <div v-if="uploadProgress > 0" class="text-sm text-gray-500">
                Enviando arquivo: {{ uploadProgress }}%
            </div>

            <div v-if="uploadedFilePath" class="text-sm text-gray-500">
                 <div class="flex gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" class="w-4 h-4">
                         <path d="M0 0h24v24H0z" fill="none"></path>
                         <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>
                     </svg>
                     Arquivo anexado
                 </div>
            </div>
            <button
              @click="triggerFileInput"
              class="p-2 text-gray-600 hover:text-blue-500 transition-colors"
              title="Anexar arquivo"
            >
              📎
            </button>
            
            <input
              v-model="newMessage"
              @keyup.enter="sendMessage"
              placeholder="Digite sua mensagem..."
              class="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              @click="sendMessage"
              :disabled="loading"
              class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
              title="Enviar mensagem"
            >
              <span class="transform rotate-90">➤</span>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Modal Novo Chat -->
      <div v-if="showNewChatModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-xl p-6 w-96">
          <h3 class="text-lg font-semibold mb-4">Novo Chat</h3>
          <input
            v-model="newChatTitle"
            type="text"
            placeholder="Nome do chat"
            class="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="flex justify-end space-x-3">
            <button
              @click="showNewChatModal = false"
              class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              @click="createNewChat"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        chats: [],
        selectedChatId: null,
        selectedModel: "openai",
        messages: [],
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