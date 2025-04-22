import { defineStore } from "pinia";
import api from "@/services/base";
import Auth from "@/services/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    loading: false,
  }),
  actions: {
    setUserData(user, token) {
      this.user = user;
      this.token = token;

      localStorage.setItem("authToken", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },

    clearUserData() {
      this.user = null;
      this.token = null;

      localStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
    },

    async fetchUser() {
      this.loading = true;
      try {
        const data = await Auth.user()

        if (data.data) {
          this.setUserData(data.data, this.token);
        } else {
          this.clearUserData();
        }
      } catch (error) {
        this.clearUserData();
        console.error("Erro ao buscar o usuário:", error);
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await Auth.logout();
        this.clearUserData();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    },

    async restoreSession() {
      const token = localStorage.getItem("authToken");
      if (token) {
        this.token = token;
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
    },
  },
});
