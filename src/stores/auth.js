import { defineStore } from "pinia";
import api from "@/services/base";
import Auth from "@/services/auth";

const IMPERSONATION_KEY = "betgpt_impersonating";
const ADMIN_AUTH_BACKUP_KEY = "betgpt_admin_auth_backup";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    isImpersonating: false,
    twoFactorData: {
      userId: "",
      authMethod: null,
    },
  }),
  actions: {
    setUserData(user, token, { impersonating = false } = {}) {
      this.user = user;
      this.token = token;

      localStorage.setItem("authToken", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      if (impersonating) {
        this.isImpersonating = true;
        localStorage.setItem(IMPERSONATION_KEY, "1");
      } else {
        this.isImpersonating = false;
        localStorage.removeItem(IMPERSONATION_KEY);
      }
    },
    setTwoFactorData(userId, authMethod){
        this.twoFactorData.authMethod = authMethod;
        this.twoFactorData.userId = userId;
    },
    clearUserData() {
      this.user = null;
      this.token = null;
      this.isImpersonating = false;

      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem(IMPERSONATION_KEY);
      localStorage.removeItem(ADMIN_AUTH_BACKUP_KEY);
      delete api.defaults.headers.common["Authorization"];
    },

    /** Guarda sessão do admin antes de abrir simulação (localStorage é compartilhado entre abas). */
    saveAdminSessionBackup() {
      if (!this.token || !this.user) return;
      try {
        localStorage.setItem(
          ADMIN_AUTH_BACKUP_KEY,
          JSON.stringify({ token: this.token, user: this.user }),
        );
      } catch (e) {
        console.error("saveAdminSessionBackup:", e);
      }
    },

    /** Restaura sessão do admin após sair da simulação. Retorna true se restaurou. */
    restoreAdminSessionFromBackup() {
      const raw = localStorage.getItem(ADMIN_AUTH_BACKUP_KEY);
      if (!raw) return false;
      try {
        const { token, user } = JSON.parse(raw);
        if (!token || !user) return false;
        localStorage.removeItem(ADMIN_AUTH_BACKUP_KEY);
        this.setUserData(user, token, { impersonating: false });
        return true;
      } catch (e) {
        console.error("restoreAdminSessionFromBackup:", e);
        localStorage.removeItem(ADMIN_AUTH_BACKUP_KEY);
        return false;
      }
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
          const wasImpersonating =
            localStorage.getItem(IMPERSONATION_KEY) === "1";
          this.setUserData(data.data, this.token, {
            impersonating: wasImpersonating,
          });
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
      this.isImpersonating = localStorage.getItem(IMPERSONATION_KEY) === "1";
    },
  },
});
