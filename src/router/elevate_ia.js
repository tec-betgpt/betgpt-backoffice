import ChatIA from "@/views/dashboard/ChatIA.vue";
import DefaultLayout from "@/layouts/default.vue";
import JarbasBOT from "@/views/dashboard/JarbasBOT.vue";

export default [
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
]
