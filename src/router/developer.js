import DefaultLayout from "@/layouts/default.vue";
import WebhookInspector from "@/views/dashboard/WebhookInspector.vue";
import WebhookInspectorDetail from "@/views/dashboard/WebhookInspectorDetail.vue";
import { WEBHOOK_INSPECTOR_ROLES } from "@/services/webhookInspector";

export default [
  {
    path: "/developer",
    name: "developer",
    meta: {
      requiresAuth: true,
      title: "Desenvolvedor",
      roles: "member",
      anyRole: WEBHOOK_INSPECTOR_ROLES,
    },
    children: [
      {
        path: "webhook-inspector",
        name: "webhook-inspector",
        component: WebhookInspector,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Webhook Inspector",
          roles: "member",
          anyRole: WEBHOOK_INSPECTOR_ROLES,
        },
      },
      {
        path: "webhook-inspector/:uuid",
        name: "webhook-inspector-detail",
        component: WebhookInspectorDetail,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Webhook Inspector",
          roles: "member",
          anyRole: WEBHOOK_INSPECTOR_ROLES,
        },
      },
    ],
  },
];
