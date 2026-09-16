import DefaultLayout from "@/layouts/default.vue";
import EmailHealthView from "@/views/email-health/EmailHealthView.vue";

export default [
  {
    path: "/email-health",
    name: "email-health",
    component: EmailHealthView,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Email Health",
      roles: "member|client",
      permissions: "access-to-reports",
    },
  },
];
