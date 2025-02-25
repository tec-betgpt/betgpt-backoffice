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
import Ia from "@/views/dashboard/Ia.vue";

import ConfigurationLayout from "@/views/configurations/Layout.vue";
import ConfigurationProfile from "@/views/configurations/Profile.vue";
import ConfigurationSecurity from "@/views/configurations/Security.vue";
import ConfigurationNotifications from "@/views/configurations/Notifications.vue";
import ConfigurationProjects from "@/views/configurations/Projects.vue";
import ConfigurationIntegrations from "@/views/configurations/Integrations.vue";
import ConfigurationConfirmEmailChange from "@/views/configurations/ConfirmEmailChange.vue";
import Texts from "@/views/dashboard/Texts.vue";
import Financial from "@/views/dashboard/Financial.vue";
import ManagerFinancial from "@/views/dashboard/ManagerFinancial.vue";
import Sectors from "@/views/dashboard/Sectors.vue";
import Costs from "@/views/dashboard/Costs.vue";
import Roles from "@/views/dashboard/Roles.vue";
import Players from "@/views/dashboard/Players.vue";
import UtmTracks from "@/views/dashboard/UtmTracks.vue";

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
    },
  },
  {
    path: "/analytics",
    name: "analytics",
    component: Analytics,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Relatórios",
      permission: "member|client",
    },
  },
  {
    path: "/sms-funnel",
    name: "sms-funnel",
    component: SmsFunnel,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "SMS Funnel",
      permission: "member|client",
    },
  },
  {
    path: "/google-analytics",
    name: "google-analytics",
    component: GoogleAnalytics,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Google Analytics",
      permission: "member|client",
    },
  },
  {
    path: "/active-campaign",
    name: "active-campaign",
    component: ActiveCampaign,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Active Campaign",
      permission: "member|client",
    },
  },
  {
    path: "/projects",
    name: "projects",
    component: Projects,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member",
      title: "Projetos",
    },
  },
  {
    path: "/texts",
    name: "texts",
    component: Texts,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member",
      title: "Textos",
    },
  },
  {
    path: "/users",
    name: "users",
    component: Users,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member",
      title: "Usuários",
    },
  },
  // Configurations routes
  {
    path: "/configurations",
    component: ConfigurationLayout,
    meta: {
      requiresAuth: true,
      title: "Configurações",
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
        },
      },
    ],
  },
  //IA
  {
    path: "/ia",
    name: "ia",
    component: Ia,
    meta: {
      layout: DefaultLayout,
      requiresAuth: false,
      permission: "member",
      title: "Ia",
    },
  },
  {
    path: "/financial",
    name: "financial",
    component: Financial,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Financeiro",
    }
  },
  {
    path:"/sector",
    name:"sector",
    component:Sectors,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Setores",
    }
  },

  {
    path: "/cost",
    name: "cost",
    component: Costs,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Custos",
    },
  },
  {
    path: "/roles",
    name: "roles",
    component: Roles,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member",
      title: "Perfis",
    },
  },
  {
    path: "/players",
    name: "players",
    component: Players,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member|client",
      title: "Jogadores",
    },
  },
  {
    path: "/utm-tracks",
    name: "utm-tracks",
    component: UtmTracks,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "member|client",
      title: "Rastreamentos UTM",
    },
  },
  {
    path: "/financialManager",
    name: "financialManager",
    component: ManagerFinancial,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Financeiro",
    },
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
    next({ name: "login" });
  } else {
    if (to.name === "root") {
      next({ name: "home" });
    } else {
      next();
    }
  }
});

export default router;
