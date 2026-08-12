import DefaultLayout from "@/layouts/default.vue";
import LinkEngine from "@/views/dashboard/LinkEngine.vue";
import Links from "@/views/dashboard/Links.vue";
import CampaignDrafts from "@/views/dashboard/CampaignDrafts.vue";
import CampaignDraftWizard from "@/views/dashboard/CampaignDraftWizard.vue";
import CampaignDetail from "@/views/dashboard/CampaignDetail.vue";
import SmsTestMessage from "@/views/dashboard/SmsTestMessage.vue";
import SmsProviderLists from "@/views/dashboard/SmsProviderLists.vue";
import SmsProviderAutomations from "@/views/dashboard/SmsProviderAutomations.vue";
import SmsProviderBroadcasts from "@/views/dashboard/SmsProviderBroadcasts.vue";
import SmsDirectSend from "@/views/dashboard/SmsDirectSend.vue";
import SmsHistory from "@/views/dashboard/SmsHistory.vue";
import CampaignMailSettings from "@/views/dashboard/CampaignMailSettings.vue";
import CampaignMonitor from "@/views/dashboard/CampaignMonitor.vue";

const marketingMeta = {
  layout: DefaultLayout,
  requiresAuth: true,
  roles: "member",
  permissions: "access-to-marketing",
};

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
          ...marketingMeta,
          title: "Campaign Builder",
        },
      },
      {
        path: "campaign-drafts/create",
        name: "campaign-drafts.create",
        component: CampaignDraftWizard,
        meta: {
          ...marketingMeta,
          title: "Nova campanha draft",
        },
      },
      {
        path: "campaign-drafts/:id/edit",
        name: "campaign-drafts.edit",
        component: CampaignDraftWizard,
        meta: {
          ...marketingMeta,
          title: "Editar campanha draft",
        },
      },
      {
        path: "campaign-drafts/:id",
        name: "campaign-drafts.show",
        component: CampaignDetail,
        meta: {
          ...marketingMeta,
          title: "Disparos da campanha",
        },
      },
      {
        path: "sms/test",
        name: "sms.test-message",
        component: SmsTestMessage,
        meta: {
          ...marketingMeta,
          title: "Teste de SMS",
        },
      },
      {
        path: "sms/lists",
        name: "sms.lists",
        component: SmsProviderLists,
        meta: {
          ...marketingMeta,
          title: "Listas de SMS",
        },
      },
      {
        path: "sms/automations",
        name: "sms.automations",
        component: SmsProviderAutomations,
        meta: {
          ...marketingMeta,
          title: "Automações de SMS",
        },
      },
      {
        path: "sms/broadcasts",
        name: "sms.broadcasts",
        component: SmsProviderBroadcasts,
        meta: {
          ...marketingMeta,
          title: "Broadcasts de SMS",
        },
      },
      {
        path: "sms/direct-send",
        name: "sms.direct-send",
        component: SmsDirectSend,
        meta: {
          ...marketingMeta,
          title: "Envio Direto de SMS",
        },
      },
      {
        path: "sms/history",
        name: "sms.history",
        component: SmsHistory,
        meta: {
          ...marketingMeta,
          title: "Histórico de SMS",
        },
      },
      {
        path: "links",
        name: "links",
        component: Links,
        meta: {
          ...marketingMeta,
          title: "Links",
        },
      },
      {
        path: "link-engine",
        name: "link-engine",
        component: LinkEngine,
        meta: {
          ...marketingMeta,
          title: "Link Engine",
        },
      },
      {
        path: "monitor/de-campanha",
        name: "campaign-monitor",
        component: CampaignMonitor,
        meta: {
          ...marketingMeta,
          title: "Monitor de Campanha",
        },
      },
      {
        path: "campaign-mail-settings",
        name: "campaign-mail-settings",
        component: CampaignMailSettings,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "E-mail SMTP (Campanhas)",
          roles: "member",
        },
      },
    ],
  },
];
