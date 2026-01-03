import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DefaultLayout from "@/layouts/default.vue";
import BlankLayout from "@/layouts/blank.vue";
import Login from "@/views/auth/Login.vue";
import Recover from "@/views/auth/Recover.vue";
import Home from "@/views/dashboard/Home.vue";
import TwoFactor from "@/views/auth/TwoFactor.vue";
import configurations from "@/router/configurations.js";
import elevate_ia from "@/router/elevate_ia.js";
import controls from "@/router/controls.js";
import audiences from "@/router/audiences.js";
import conversions from "@/router/conversions.js";
import manage from "@/router/manage.js";
import governance from "@/router/governance.js";
import financial from "@/router/financial.js";

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
  ...configurations,
  ...elevate_ia,
  ...controls,
  ...audiences,
  ...conversions,
  ...manage,
  ...governance,
  ...financial
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
