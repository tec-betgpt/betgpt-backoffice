import { defineStore } from "pinia";
import api from "@/services/api";

export const useConfigStore = defineStore("config", {
  state: () => ({
    message: null,
    loading: false,
  }),
  actions: {
    async fetchConfigs() {
      try {
        const response = await api.get("/configs");
        this.message = response.data.data.message || {
          message: "",
          signature: "",
        };
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        this.message = null;
      }
    },

    async setLoading(loading) {
      if (this.loading === loading) return;
      this.loading = loading;
      if (loading) {
        await this.fetchConfigs();
      }
    },
  },
});
