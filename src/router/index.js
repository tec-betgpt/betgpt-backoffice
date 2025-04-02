import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DefaultLayout from "@/layouts/default.vue";
import BlankLayout from "@/layouts/blank.vue";

import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";
import Recover from "@/views/auth/Recover.vue";
import Home from "@/views/dashboard/Home.vue";
import Analytics from "@/views/dashboard/Analytics.vue";
import SmsFunnel from "@/views/dashboard/SmsFunnel.vue";
import GoogleAnalytics from "@/views/dashboard/GoogleAnalytics.vue";
import ActiveCampaign from "@/views/dashboard/ActiveCampaign.vue";
import Projects from "@/views/dashboard/Projects.vue";
import Users from "@/views/dashboard/Users.vue";

import ConfigurationLayout from "@/views/configurations/Layout.vue";
import ConfigurationProfile from "@/views/configurations/Profile.vue";
import ConfigurationSecurity from "@/views/configurations/Security.vue";
import ConfigurationNotifications from "@/views/configurations/Notifications.vue";
import ConfigurationProjects from "@/views/configurations/Projects.vue";
import ConfigurationIntegrations from "@/views/configurations/Integrations.vue";
import ConfigurationConfirmEmailChange from "@/views/configurations/ConfirmEmailChange.vue";
import Texts from "@/views/dashboard/Texts.vue";
import Financial from "@/views/dashboard/Financial.vue";
import Sectors from "@/views/dashboard/Sectors.vue";
import Costs from "@/views/dashboard/Costs.vue";
import Roles from "@/views/dashboard/Roles.vue";
import Players from "@/views/dashboard/Players.vue";
import UtmTracks from "@/views/dashboard/UtmTracks.vue";
import IA from "@/views/dashboard/IA.vue";

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
  /*{
    path: "/register",
    name: "register",
    component: Register,
    meta: { layout: BlankLayout, title: "Cadastrar" },
  },*/
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
    path: "/home",
    name: "home",
    component: Home,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Home",
      permission: "member|client",
      roles: "access-to-dashboard"
    },
  },
  {
    path: "/configurations",
    component: ConfigurationLayout,
    meta: {
      requiresAuth: true,
      title: "Configurações",
      permission: "member|client",

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
          permission: "member|client",

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
          permission: "member|client",

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
          permission: "member|client",

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
          permission: "member",
        },
      },
      {
        path: "integrations",
        name: "configurations.integrations",
        component: ConfigurationIntegrations,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Integrações",
          permission: "member",
          roles: "access-to-integrations"
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
          permission: "member|client",
        },
      },
    ],
  },
  {
    path: "/elevate-ia",
    name: "ia",
    component: IA,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member",
      roles: "access-to-ai",
      title: "Elevate IA",
    },
  },
  {
    path: "/controls",
    name: "controls",
    meta: {
      requiresAuth: true,
      title: "Relatórios",
      permission: "member|client",
      roles: "access-to-reports"
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
          permission: "member|client",
          roles: "access-to-reports"
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
          permission: "member|client",
          roles: "access-to-reports"
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
          permission: "member|client",
          roles: "access-to-reports"
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
          permission: "member|client",
          roles: "access-to-reports"
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
      permission: "member",
      roles: "access-to-management"
    },
    children: [
      {
        path: "projects",
        name: "projects",
        component: Projects,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          permission: "member",
          roles: "view-projects",
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
          permission: "member",
          roles: "access-to-motivational-texts",
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
          permission: "member",
          roles: "view-users",
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
          permission: "member",
          roles: "access-to-permissions",
          title: "Perfis",
        },
      },
      {
        path: "players",
        name: "players",
        component: Players,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          permission: "member|client",
          roles: "player-registrations",
          title: "Jogadores",
        },
      },
      {
        path: "utm-tracks",
        name: "utm-tracks",
        component: UtmTracks,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          permission: "member|client",
          roles: "access-to-parameter-tracking",
          title: "Rastreamentos UTM",
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
      permission: "member",
      roles: "access-to-finance"
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
          permission: "member",
          roles: "access-to-finance"
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
          permission: "member",
          roles: "access-to-finance"
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
          permission: "member",
          roles: "access-to-finance"
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

  if (!authStore.user && localStorage.getItem("authToken") && !authStore.loading) {
    await authStore.fetchUser();
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return next({ name: "login" });
  }

  if (to.meta.requiresAuth && to.meta.roles) {
    const hasPermission = authStore.user?.roles.some(role =>
        role.permissions.some(permission =>
            to.meta.roles.includes(permission.name)
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
