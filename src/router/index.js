import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DefaultLayout from "@/layouts/default.vue";
import BlankLayout from "@/layouts/blank.vue";

import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";
import Recover from "@/views/auth/Recover.vue";
import Home from "@/views/dashboard/Home.vue";
import Analytics from "@/views/dashboard/Analytics.vue";

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
    meta: { layout: BlankLayout, title: "Recuperar" },
  },
  {
    path: "/home",
    name: "home",
    component: Home,
    meta: { layout: DefaultLayout, requiresAuth: true, title: "Home" },
  },
  {
    path: "/analytics",
    name: "analytics",
    component: Analytics,
    meta: { layout: DefaultLayout, requiresAuth: true, title: "Relatórios" },
  },
  {
    path: "/clients",
    name: "clients",
    component: Analytics,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      permission: "admin",
      title: "Relatórios",
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
