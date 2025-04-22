import { defineStore } from "pinia";
import Config from '@/services/config'

export const useConfigStore = defineStore("config", {
  state: () => ({
    message: null,
    loading: false,
  }),
  actions: {
    async fetchConfigs() {
      try {
        const data = await Config.index()
        this.message = data.data.message || {
          message: "",
          signature: "",
        };
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        this.message = {
          message: "",
          signature: "",
        };
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
