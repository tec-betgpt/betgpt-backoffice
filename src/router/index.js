import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import DefaultLayout from "@/layouts/default.vue";
import BlankLayout from "@/layouts/blank.vue";

import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue";
import Recover from "@/views/auth/Recover.vue";
import Home from "@/views/dashboard/Home.vue";

const routes = [
  {
    path: "/",
    name: "root",
  },
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { layout: BlankLayout },
  },
  {
    path: "/register",
    name: "register",
    component: Register,
    meta: { layout: BlankLayout },
  },
  {
    path: "/recover",
    name: "recover",
    component: Recover,
    meta: { layout: BlankLayout },
  },
  {
    path: "/home",
    name: "home",
    component: Home,
    meta: { layout: DefaultLayout, requiresAuth: true },
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

  console.log("chegou aqui");

  if (to.meta.requiresAuth && !authStore.user) {
    console.log("foi de beise");
    next({ name: "login" });
  } else {
    console.log("foi de beise2");
    if (to.name === "root") {
      next({ name: "home" });
    } else {
      next();
    }
  }
});

export default router;
