import Insights from "@/views/dashboard/Insights.vue";
import DefaultLayout from "@/layouts/default.vue";
import Roles from "@/views/dashboard/Roles.vue";
import Services from "@/views/dashboard/Services.vue";
import Permissions from "@/views/dashboard/Permissions.vue";
import Subscribers from "@/views/dashboard/Subscribers.vue";
import Users from "@/views/dashboard/Users.vue";
import UserLogins from "@/views/dashboard/UserLogins.vue";
import InsightIA from "@/views/dashboard/InsightIA.vue";
import AIController from "@/views/dashboard/AIController.vue";
import WebhookLogs from "@/views/dashboard/WebhookLogs.vue";
import LinkEngine from "@/views/dashboard/LinkEngine.vue";
import Links from "@/views/dashboard/Links.vue";
import CampaignDrafts from "@/views/dashboard/CampaignDrafts.vue";
import CampaignDraftWizard from "@/views/dashboard/CampaignDraftWizard.vue";

import Tags from "@/views/dashboard/Tags.vue";

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
        {
          path: "ai-controller",
          name: "ai-controller",
          component: AIController,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Controlador IA",
            roles: "member",
            permissions: "access-to-ai",
          },
        },
        {
          path: "webhook-logs",
          name: "webhook-logs",
          component: WebhookLogs,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Logs de Webhooks",
            roles: "member",
            permissions: "access-to-webhook-logs",
          },
        },
        {
          path: "links",
          name: "links",
          component: Links,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Links",
            roles: "member",
            permissions: "access-to-member-governance",
          },
        },
        {
          path: "link-engine",
          name: "link-engine",
          component: LinkEngine,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Link Engine",
            roles: "member",
            permissions: "access-to-member-governance",
          },
        },
        {
          path: "campaign-drafts",
          name: "campaign-drafts.index",
          component: CampaignDrafts,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Campaign Builder",
            roles: "member",
            permissions: "access-to-member-governance",
          },
        },
        {
          path: "campaign-drafts/create",
          name: "campaign-drafts.create",
          component: CampaignDraftWizard,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Nova campanha draft",
            roles: "member",
            permissions: "access-to-member-governance",
          },
        },
        {
          path: "campaign-drafts/:id/edit",
          name: "campaign-drafts.edit",
          component: CampaignDraftWizard,
          meta: {
            layout: DefaultLayout,
            requiresAuth: true,
            title: "Editar campanha draft",
            roles: "member",
            permissions: "access-to-member-governance",
          },
        },
    ],
  },
]
