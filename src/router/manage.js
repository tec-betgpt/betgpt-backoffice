import GroupProjects from "@/views/dashboard/GroupProjects.vue";
import DefaultLayout from "@/layouts/default.vue";
import Projects from "@/views/dashboard/Projects.vue";
import Insights from "@/views/dashboard/Insights.vue";
import Users from "@/views/dashboard/Users.vue";
import Integrations from "@/views/dashboard/Integrations.vue";

export default [
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
        path: "group-projects",
        name: "configurations.projects",
        component: GroupProjects,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Grupo de Projetos",
          roles: "member",
          permissions: "access-to-project-groups",
        },
      },
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
        component: Insights,
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
        path: "data-sources",
        name: "data-sources",
        component: Integrations,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "access-to-integrations",
          title: "Fontes de Dados",
        },
      },
    ],
  },
]
