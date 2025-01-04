<template>
    <div class="flex flex-col h-screen bg-gray-100">
      <div class="sticky top-0 z-10 bg-gray-800 text-white p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Chat</h2>
          <select
            v-model="selectedModel"
            class="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>
        </div>
      </div>
  
      <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'"
        >
          <div
            :class="[ 'p-3 rounded-lg', message.sender === 'user' ? 'bg-blue-500 text-white max-w-2xl' : 'bg-gray-300 text-gray-800 w-full' ]"
          >
            <p v-if="message.content" class="text-sm">{{ message.content }}</p>
            <a
              v-if="message.file"
              :href="message.file"
              target="_blank"
              class="text-sm text-blue-400 underline break-words"
            >
              {{ extractFileName(message.file) }}
            </a>
          </div>
        </div>
        <div v-if="loading" class="text-center text-gray-500">
          Enviando mensagem...
        </div>
      </div>
  
      <div class="sticky bottom-0 bg-white p-4 border-t">
        <div class="flex items-center space-x-4">
          <input
            type="file"
            @change="handleFileUpload"
            class="hidden"
            ref="fileInput"
          />
          <button
            @click="triggerFileInput"
            class="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300"
          >
            📎
          </button>
          <input
            v-model="newMessage"
            type="text"
            placeholder="Digite sua mensagem..."
            class="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            :disabled="loading"
            @click="sendMessage"
            class="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        messages: [],
        newMessage: "",
        selectedModel: "openai",
        file: null,
        loading: false,
      };
    },
    methods: {
      async loadMessages() {
        try {
          const response = await axios.get("https://ia.betgpt.com.br/chat/2/messages", {
            headers: {
              Authorization: `Bearer d497eefe1c7126b1b94e90ee5c2b988fde5db376`,
            },
          });
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
        if (!this.newMessage && !this.file) return;
  
        const userMessage = {
          sender: "user",
          content: this.newMessage,
          iaModel: this.selectedModel,
          file: this.file ? this.file.name : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
  
        this.loading = true;
        try {
          this.messages.push(userMessage);
          this.scrollToBottom();
  
          const response = await axios.post("https://ia.betgpt.com.br/chat/2/message", userMessage, {
            headers: {
              Authorization: `Bearer d497eefe1c7126b1b94e90ee5c2b988fde5db376`,
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
          this.file = null;
        } catch (error) {
          console.error("Erro ao enviar mensagem:", error);
        } finally {
          this.loading = false;
        }
      },
      triggerFileInput() {
        this.$refs.fileInput.click();
      },
      handleFileUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
          this.file = files[0];
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
      this.loadMessages();
    },
  };
</script>  