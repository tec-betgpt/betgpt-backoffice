import Insights from "@/views/dashboard/Insights.vue";
import DefaultLayout from "@/layouts/default.vue";
import Roles from "@/views/dashboard/Roles.vue";
import Services from "@/views/dashboard/Services.vue";
import Permissions from "@/views/dashboard/Permissions.vue";
import Subscribers from "@/views/dashboard/Subscribers.vue";
import Users from "@/views/dashboard/Users.vue";
import UserLogins from "@/views/dashboard/UserLogins.vue";
import InsightIA from "@/views/dashboard/InsightIA.vue";

export default [
  {
    path: "/governance",
    name: "governance",
    meta: {
      requiresAuth: true,
      title: "Governança",
      roles: "member",
      permissions: "access-to-member-governance",
    },
    children: [
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
        path: "roles",
        name: "roles",
        component: Roles,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-roles",
          title: "Perfis",
        },
      },
      {
        path: "services",
        name: "services",
        component: Services,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Serviços",
          roles: "member",
          permissions: "access-to-services",
        },
      },
      {
        path: "permissions",
        name: "permissions",
        component: Permissions,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Permissões",
          roles: "member",
          permissions: "access-to-permissions",
        },
      },
      {
        path: "subscribers",
        name: "subscribers",
        component: Subscribers,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Assinantes",
          roles: "member",
          permissions: "access-to-subscribers",
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
        path: "user-logins",
        name: "user-logins",
        component: UserLogins,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-users",
          title: "Histórico de Login",
        },

      },
        {
            path: "insight-ia",
            name: "insightIA",
            component: InsightIA,
            meta: {
                layout: DefaultLayout,
                requiresAuth: true,
                title: "Insight IA",
                roles: "member",
                permissions: "access-to-ai",
            },
        },
    ],
  },
]
