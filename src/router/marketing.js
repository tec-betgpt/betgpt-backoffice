import DefaultLayout from "@/layouts/default.vue";
import LinkEngine from "@/views/dashboard/LinkEngine.vue";
import Links from "@/views/dashboard/Links.vue";
import CampaignDrafts from "@/views/dashboard/CampaignDrafts.vue";
import CampaignDraftWizard from "@/views/dashboard/CampaignDraftWizard.vue";

export default [
  {
    path: "/marketing",
    name: "marketing",
    meta: {
      requiresAuth: true,
      title: "Marketing",
      roles: "member",
      permissions: "access-to-marketing",
    },
    children: [
      {
        path: "campaign-drafts",
        name: "campaign-drafts.index",
        component: CampaignDrafts,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Campaign Builder",
          roles: "member",
          permissions: "access-to-marketing",
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
          permissions: "access-to-marketing",
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
          permissions: "access-to-marketing",
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
          permissions: "access-to-marketing",
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
          permissions: "access-to-marketing",
        },
      },
    ],
  },
];
