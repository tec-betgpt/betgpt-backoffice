import DefaultLayout from "@/layouts/default.vue";
import ProtectionLists from "@/views/dashboard/ProtectionLists.vue";
import ProtectionListReports from "@/views/dashboard/ProtectionListReports.vue";
import ProtectionListDashboard from "@/views/dashboard/ProtectionListDashboard.vue";

export default [
  {
    path: "/protection",
    name: "protection",
    meta: {
      requiresAuth: true,
      title: "Proteção",
      roles: "member",
      permissions: "protection-list-view",
    },
    children: [
      {
        path: "protection-list-dashboard",
        name: "protection-list-dashboard",
        component: ProtectionListDashboard,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Dashboard da Lista de Proteção",
          roles: "member",
          permissions: "protection-list-view",
        },
      },
      {
        path: "protection-lists",
        name: "protection-lists",
        component: ProtectionLists,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Listas de Proteção",
          roles: "member",
          permissions: "protection-list-view",
        },
      },
      {
        path: "protection-list-reports",
        name: "protection-list-reports",
        component: ProtectionListReports,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Relatórios de Proteção",
          roles: "member",
          permissions: "protection-list-view",
        },
      },
    ],
  },
]
