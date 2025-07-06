import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DefaultLayout from "@/layouts/default.vue";
import BlankLayout from "@/layouts/blank.vue";

import Login from "@/views/auth/Login.vue";
import Recover from "@/views/auth/Recover.vue";
import Home from "@/views/dashboard/Home.vue";
import Analytics from "@/views/dashboard/Analytics.vue";
import SmsFunnel from "@/views/dashboard/SmsFunnel.vue";
import GoogleAnalytics from "@/views/dashboard/GoogleAnalytics.vue";
import ActiveCampaign from "@/views/dashboard/ActiveCampaign.vue";
import Projects from "@/views/dashboard/Projects.vue";
import Users from "@/views/dashboard/Users.vue";
import Segments from "@/views/dashboard/Segments.vue";

import ConfigurationLayout from "@/views/configurations/Layout.vue";
import ConfigurationProfile from "@/views/configurations/Profile.vue";
import ConfigurationSecurity from "@/views/configurations/Security.vue";
import ConfigurationNotifications from "@/views/configurations/Notifications.vue";
import ConfigurationProjects from "@/views/configurations/Projects.vue";
import ConfigurationConfirmEmailChange from "@/views/configurations/ConfirmEmailChange.vue";
import Texts from "@/views/dashboard/Texts.vue";
import Financial from "@/views/dashboard/Financial.vue";
import Sectors from "@/views/dashboard/Sectors.vue";
import Costs from "@/views/dashboard/Costs.vue";
import Roles from "@/views/dashboard/Roles.vue";
import Players from "@/views/dashboard/Players.vue";
import UtmTracks from "@/views/dashboard/UtmTracks.vue";
import ChatIA from "@/views/dashboard/ChatIA.vue";
import JarbasBOT from "@/views/dashboard/JarbasBOT.vue";
import Integrations from "@/views/dashboard/Integrations.vue";
import TwoFactor from "@/views/auth/TwoFactor.vue";

const routes = [
  {
    path: "/",
    name: "root",
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { layout: BlankLayout, title: "Login" },
  },
  {
    path: "/recover",
    name: "recover",
    component: Recover,
    meta: {
      layout: BlankLayout,
      title: "Recuperar",
    },
  },
  {
    path: "/two-factor",
    name: "two-factor",
    component: TwoFactor,
    meta: { layout: BlankLayout, title: "Autenticação de dois fatores" },
  },
  {
    path: "/home",
    name: "home",
    component: Home,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Home",
      roles: "member|client",
    },
  },
  {
    path: "/configurations",
    component: ConfigurationLayout,
    meta: {
      requiresAuth: true,
      title: "Configurações",
      roles: "member|client",
    },
    children: [
      { path: "", redirect: "/configurations/profile" },
      {
        path: "profile",
        name: "configurations.profile",
        component: ConfigurationProfile,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Perfil",
          roles: "member|client",
        },
      },
      {
        path: "security",
        name: "configurations.security",
        component: ConfigurationSecurity,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Segurança",
          roles: "member|client",
        },
      },
      {
        path: "notifications",
        name: "configurations.notifications",
        component: ConfigurationNotifications,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Notificações",
          roles: "member|client",
        },
      },
      {
        path: "projects",
        name: "configurations.projects",
        component: ConfigurationProjects,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Projetos",
          roles: "member",
        },
      },

      {
        path: "confirm-email-change/:token",
        name: "configurations.confirm-email-change",
        component: ConfigurationConfirmEmailChange,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Confirmação de E-mail",
          roles: "member|client",
        },
      },
    ],
  },
  {
    path: "/elevate-ia",
    name: "elevate-ia",
    meta: {
      requiresAuth: true,
      roles: "member|client",
      permissions: "access-to-ai",
      title: "Elevate IA",
    },
    children: [
      {
        path: "chat",
        name: "chat",
        component: ChatIA,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Chat",
          roles: "member|client",
          permissions: "access-to-ai",
        },
      },
      {
        path: "jarbas-bot",
        name: "jarbas-bot",
        component: JarbasBOT,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Jarbas BOT",
          roles: "member|client",
          permissions: "access-to-ai",
        },
      },
    ],
  },
  {
    path: "/controls",
    name: "controls",
    meta: {
      requiresAuth: true,
      title: "Relatórios",
      roles: "member|client",
      permissions: "access-to-reports",
    },
    children: [
      {
        path: "performances",
        name: "performances",
        component: Analytics,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Performance",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "traffics",
        name: "traffics",
        component: GoogleAnalytics,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Tráfego",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "emails",
        name: "emails",
        component: ActiveCampaign,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "E-mails",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "sms-insights",
        name: "sms-insights",
        component: SmsFunnel,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "SMS",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
    ],
  },
  {
    path: "/audiences",
    name: "audiences",
    meta: {
      requiresAuth: true,
      title: "Audiências",
      roles: "member",
      permissions: "access-to-management",
    },
    children: [
      {
        path: "segments",
        name: "segments",
        component: Segments,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "view-segments",
          title: "Segmentos",
        },
      },
      {
        path: "clients",
        name: "clients",
        component: Players,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "player-registrations",
          title: "Jogadores",
        },
      },
      {
        path: "attributions",
        name: "attributions",
        component: UtmTracks,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "access-to-parameter-tracking",
          title: "Rastreamentos UTM",
        },
      },
    ],
  },
  {
    path: "/manage",
    name: "manage",
    meta: {
      requiresAuth: true,
      title: "Gerenciamento",
      roles: "member",
      permissions: "access-to-management",
    },
    children: [
      {
        path: "projects",
        name: "projects",
        component: Projects,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "view-projects",
          title: "Projetos",
        },
      },
      {
        path: "texts",
        name: "texts",
        component: Texts,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-motivational-texts",
          title: "Textos",
        },
      },
      {
        path: "users",
        name: "users",
        component: Users,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-users",
          title: "Usuários",
        },
      },
      {
        path: "roles",
        name: "roles",
        component: Roles,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-permissions",
          title: "Perfis",
        },
      },
      {
        path: "integrations",
        name: "integrations",
        component: Integrations,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "access-to-integrations",
          title: "Integrações",
        },
      },
    ],
  },
  {
    path: "/financial",
    name: "financial",
    meta: {
      requiresAuth: true,
      title: "Financeiro",
      roles: "member",
      permissions: "access-to-finance",
    },
    children: [
      {
        path: "sectors",
        name: "sectors",
        component: Sectors,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Setores",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "costs",
        name: "costs",
        component: Costs,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Custos",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "registers",
        name: "registers",
        component: Financial,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Financeiro",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (
    !authStore.user &&
    localStorage.getItem("authToken") &&
    !authStore.loading
  ) {
    await authStore.fetchUser();
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return next({ name: "login" });
  }

  if (to.meta.requiresAuth && to.meta.permissions) {
    const hasPermission = authStore.user?.roles.some((role) =>
      role.permissions.some((permission) =>
        to.meta.permissions.includes(permission.name)
      )
    );

    if (!hasPermission) {
      return next({ name: "home" });
    }
  }

  if (to.name === "root") {
    return next({ name: "home" });
  }

  next();
});

export default router;
