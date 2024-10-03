import { createRouter, createWebHistory } from "vue-router";
import Login from "@/views/auth/Login.vue";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/",
    name: "root",
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.user && localStorage.getItem("authToken")) {
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
