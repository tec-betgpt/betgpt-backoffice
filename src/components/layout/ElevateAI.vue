<template>
  <Sidebar side="right" :collapsed="collapsed"    collapsible="icon" >
    <SidebarHeader  class="p-4 max-h-64">
      <h1 class="font-bold">
        Elevate IA
      </h1>
      <div>
        <p class="text-[16px] py-4">
          Histórico
        </p>
        <div>
          <p class="border-b-2 text-[10px] truncate pb-2">Como fazer um bolo de laranja</p>
        </div>
      </div>
    </SidebarHeader>
    <SidebarContent class="p-4 ">
      <Card class="h-full w-full  p-2 bg-[#1c1c1c]">
        <div class="flex flex-col h-full">
          <div class="flex-1 overflow-y-auto" ref="messageContainerRef">
            <div v-for="message in messages" :key="message.id" class="mb-4">
              <div>
                <div  class="space-x-2 pb-2" :class="(message.sender === 'user' ? 'flex justify-end' : 'flex justify-start')">
                  <Avatar class="h-4 w-4 rounded-lg">
                    <AvatarImage :src="authStore.user?.icon" />
                    <AvatarFallback class="rounded-lg">
                      {{ authStore.user?.initials }}
                    </AvatarFallback>
                  </Avatar>
                  <p class="text-[10px]">{{message.sender === 'user'? 'Você':'I.A'}}</p>
                </div>
                <p class="text-[12px]" :class="(message.sender === 'user' ? 'flex text-end' : 'flex text-start')">{{ message.content }}</p>
                <div v-if="message.file" class="mt-2">
                  <a :href="message.file" target="_blank" class="text-blue-500 hover:underline">
                    {{ extractFileName(message.file) }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </SidebarContent>
    <SidebarFooter  class="p-4  grid grid-cols-1 gap-2">
      <Textarea placeholder="Digite aqui..."  />
      <Button class="bg-yellow-300">
        Enviar
      </Button>
      <Button variant="ghost">
        <Paperclip /> Anexar arquivo
      </Button>
      <p class="text-[8px]">
        As respostas podem mostrar informações imprecisas qualquer duvida entre em contato conosco.
      </p>
    </SidebarFooter>
  </Sidebar>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {Card} from "@/components/ui/card";
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, type SidebarProps} from "@/components/ui/sidebar";
import {Textarea} from "@/components/ui/textarea";
import {Paperclip} from "lucide-vue-next";
import axios from "axios";
import {useAuthStore} from "@/stores/auth";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

const props = defineProps({
  collapsed:{
    type: Boolean,
    default: false,
  }
});
interface Chat {
  id: number;
  title: string;
}
interface Message {
  id: number;
  sender: "user" | "assistant";
  content: string;
  iaModel: string;
  file: string | null;
  createdAt: string;
  updatedAt: string;
}
export default defineComponent({
  name: "ElevateAI",
  components: {
    Avatar,
    AvatarFallback,
    AvatarImage,
    SidebarHeader, Paperclip, Textarea, Sidebar, SidebarFooter, SidebarContent, Card},
  data() {
    return {
      collapsed: props.collapsed,
      authStore : useAuthStore(),
      chats: [] as Chat[],
      selectedChatId: undefined,
      selectedModel: "openai",
      messages: [
        {
          id: 1,
          sender: "user",
          content: "Olá, este é um teste de mensagem!",
          iaModel: "openai",
          file: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          sender: "assistant",
          content: "Olá! Como posso ajudar você hoje?",
          iaModel: "openai",
          file: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ] as Message[],
      newMessage: "",
      uploadProgress: 0,
      file: null,
      loading: false,
      showNewChatModal: false,
      newChatTitle: "",
      uploadedFilePath: undefined,
      fileInputRef: undefined,
      messageContainerRef: undefined,
    };
  },
methods: {
  async loadChats() {
    this.loading = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/list`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      this.chats = response.data.chats;
      if (this.chats.length > 0 && !this.selectedChatId) {
        this.selectedChatId = this.chats[0].id.toString();
        await this.loadMessages();
      }
    } catch (error) {
      console.error("Erro ao carregar chats:", error);
    } finally {
      this.loading = false;
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      this.chats.push(response.data.chat);
      this.selectedChatId = response.data.chat.id.toString();

      this.newChatTitle = "";
    } catch (error) {
      console.error("Erro ao criar chat:", error);
    } finally {
      this.showNewChatModal = false;
    }
  },

  async deleteChat(chatId: number) {
    if (!confirm("Tem certeza que deseja excluir este chat?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      this.chats = this.chats.filter((c) => c.id !== chatId);
      if (this.selectedChatId === chatId) {
        this.selectedChatId =
          this.chats.length > 0 ? this.chats[0].id.toString() : null;
      }
    } catch (error) {
      console.error("Erro ao excluir chat:", error);
    }
  },

  async selectChat(chatId: number) {
    this.selectedChatId = chatId;
  },

  async loadMessages() {
    if (!this.selectedChatId) return;
    this.messages = [];

    this.loading = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      this.messages = response.data.messages;
      this.scrollToBottom();
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      this.loading = false;
    }
  },

  extractFileName(url: string): string {
    return url.split("/").pop() || "";
  },

  async sendMessage() {
    if (!this.newMessage && !this.uploadedFilePath) return;

    const userMessage: any = {
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
      this.newMessage = "";
      this.uploadedFilePath = null;
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_IA_URL}/chat/${this.selectedChatId}/message`,
        userMessage,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const assistantMessage: any = {
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
      if (this.fileInputRef) this.fileInputRef.value = "";
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      this.loading = false;
    }
  },

  async handleFileUpload(event: Event) {
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          onUploadProgress: (progressEvent: any) => {
            this.uploadProgress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          },
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
      const container = this.messageContainerRef;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  },
}
})
</script>


<style scoped>

</style>