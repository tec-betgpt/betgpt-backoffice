import { defineStore } from "pinia";

export const useIAAnaliseStore = defineStore("iaAnalise", {
  state: () => ({
    isLoading: false,
    chatId: null as string | null,
  }),
  actions: {
    startAnalise(chatId: string) {
      this.isLoading = true;
      this.chatId = chatId;
    },

    finishAnalise() {
      this.isLoading = false;
    },

    reset() {
      this.isLoading = false;
      this.chatId = null;
    },
  },
});