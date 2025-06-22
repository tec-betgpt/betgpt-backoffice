import { defineStore } from "pinia";
import api from "@/services/base";
import Auth from "@/services/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    twoFactorData: {
      userId: "",
      authMethod: null,
    },
  }),
  actions: {
    setUserData(user, token) {
      this.user = user;
      this.token = token;

      localStorage.setItem("authToken", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },
    setTwoFactorData(userId, authMethod){
        this.twoFactorData.authMethod = authMethod;
        this.twoFactorData.userId = userId;
    },
    clearUserData() {
      this.user = null;
      this.token = null;

      localStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
    },
    clearTwoFactorData() {
      this.twoFactorData.authMethod = null;
      this.twoFactorData.userId = null;
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
