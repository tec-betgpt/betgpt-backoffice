import ChatIA from "@/views/dashboard/ChatIA.vue";
import DefaultLayout from "@/layouts/default.vue";
import JarbasBOT from "@/views/dashboard/JarbasBOT.vue";
import InsightIA from "@/views/dashboard/InsightIA.vue";

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
      // {
      //   path: "insight-ia",
      //   name: "insightIA",
      //   component: InsightIA,
      //   meta: {
      //     layout: DefaultLayout,
      //     requiresAuth: true,
      //     title: "Insight IA",
      //     roles: "member",
      //     permissions: "access-to-ai",
      //   },
      // },
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
