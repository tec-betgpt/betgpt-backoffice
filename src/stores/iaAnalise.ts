import { defineStore } from "pinia";

export const useIAAnaliseStore = defineStore("iaAnalise", {
  state: () => ({
    isLoading: false,
    chatId: null as string | null,
    error: null as string | null,
  }),
  actions: {
    startAnalise(chatId: string) {
      this.isLoading = true;
      this.chatId = chatId;
      this.error = null;
    },

    finishAnalise() {
      this.isLoading = false;
    },

    setError(message: string) {
      this.error = message;
    },

    reset() {
      this.isLoading = false;
      this.chatId = null;
      this.error = null;
    },
  },
});
