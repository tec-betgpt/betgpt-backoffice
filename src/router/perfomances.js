import Analytics from "@/views/dashboard/Analytics.vue";
import DefaultLayout from "@/layouts/default.vue";
import GoogleAnalytics from "@/views/dashboard/GoogleAnalytics.vue";
import ActiveCampaign from "@/views/dashboard/ActiveCampaign.vue";
import SmsFunnel from "@/views/dashboard/SmsFunnel.vue";
import Call4u from "@/views/dashboard/Call4u.vue";
import PostbackLogs from "@/views/dashboard/PostbackLogs.vue";

export default [
  {
    path: "/perfomance",
    name: "perfomance",
    meta: {
      requiresAuth: true,
      title: "Relatórios",
      roles: "member|client",
      permissions: "access-to-reports",
    },
    children: [
      {
        path: "controls",
        name: "controls",
        component: Analytics,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Controles",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "traffics",
        name: "traffics",
        component: GoogleAnalytics,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Tráfego",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "emails",
        name: "emails",
        component: ActiveCampaign,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "E-mails",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "sms-insights",
        name: "sms-insights",
        component: SmsFunnel,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "SMS",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "calls",
        name: "calls",
        component: Call4u,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Ligações",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      },
      {
        path: "elevate-api",
        name: "elevate-api",
        component: PostbackLogs,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-postback-logs",
          title: "Elevate API",
        },
      },
    ],
  },
];
