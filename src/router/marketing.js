import DefaultLayout from "@/layouts/default.vue";
import CampaignDrafts from "@/views/dashboard/CampaignDrafts.vue";
import CampaignDraftWizard from "@/views/dashboard/CampaignDraftWizard.vue";
import CampaignDetail from "@/views/dashboard/CampaignDetail.vue";
import EmailsPage from "@/views/dashboard/marketing/EmailsPage.vue";
import InboxPage from "@/views/dashboard/marketing/InboxPage.vue";
import WebpushPage from "@/views/dashboard/marketing/WebpushPage.vue";
import SmsPage from "@/views/dashboard/marketing/SmsPage.vue";
import PopupsPage from "@/views/dashboard/marketing/PopupsPage.vue";
import CallcenterPage from "@/views/dashboard/marketing/CallcenterPage.vue";
import WhatsappPage from "@/views/dashboard/marketing/WhatsappPage.vue";
import RcsPage from "@/views/dashboard/marketing/RcsPage.vue";

const marketingMeta = {
  layout: DefaultLayout,
  requiresAuth: true,
  roles: "member",
  permissions: "access-to-marketing",
};

const channelRoute = (path, name, component, title) => ({
  path,
  name,
  component,
  meta: { ...marketingMeta, title },
});

const smsRedirect = (path, name, tab, title) => ({
  path,
  name,
  redirect: { name: "marketing.sms", query: { tab } },
  meta: { ...marketingMeta, title },
});

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
        meta: { ...marketingMeta, title: "Campaign Builder" },
      },
      {
        path: "campaign-drafts/create",
        name: "campaign-drafts.create",
        component: CampaignDraftWizard,
        meta: { ...marketingMeta, title: "Nova campanha draft" },
      },
      {
        path: "campaign-drafts/:id/edit",
        name: "campaign-drafts.edit",
        component: CampaignDraftWizard,
        meta: { ...marketingMeta, title: "Editar campanha draft" },
      },
      {
        path: "campaign-drafts/:id",
        name: "campaign-drafts.show",
        component: CampaignDetail,
        meta: { ...marketingMeta, title: "Disparos da campanha" },
      },
      channelRoute("emails", "marketing.emails", EmailsPage, "Templates de E-mail"),
      channelRoute("inbox", "marketing.inbox", InboxPage, "Templates de Inbox"),
      channelRoute("webpush", "marketing.webpush", WebpushPage, "Templates de Webpush"),
      channelRoute("sms", "marketing.sms", SmsPage, "SMS"),
      channelRoute("popups", "marketing.popups", PopupsPage, "Templates de PopUps"),
      channelRoute("callcenter", "marketing.callcenter", CallcenterPage, "Templates de Callcenter"),
      channelRoute("whatsapp", "marketing.whatsapp", WhatsappPage, "Templates de Whatsapp"),
      channelRoute("rcs", "marketing.rcs", RcsPage, "Templates de RCS"),
      smsRedirect("sms/test", "sms.test-message", "test", "Teste de SMS"),
      smsRedirect("sms/lists", "sms.lists", "lists", "Listas de SMS"),
      smsRedirect("sms/automations", "sms.automations", "automations", "Automações de SMS"),
      smsRedirect("sms/broadcasts", "sms.broadcasts", "broadcasts", "Broadcasts de SMS"),
      smsRedirect("sms/direct-send", "sms.direct-send", "direct-send", "Envio Direto de SMS"),
      smsRedirect("sms/history", "sms.history", "history", "Histórico de SMS"),
      {
        path: "monitor/de-campanha",
        name: "campaign-monitor",
        redirect: { name: "campaign-drafts.index" },
        meta: { ...marketingMeta, title: "Monitor de Campanha" },
      },
      {
        path: "campaign-mail-settings",
        name: "campaign-mail-settings",
        redirect: { name: "marketing.emails", query: { tab: "smtp" } },
        meta: { ...marketingMeta, title: "E-mail SMTP (Campanhas)" },
      },
    ],
  },
];
