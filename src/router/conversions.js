import DefaultLayout from "@/layouts/default.vue";
import ConversionDefinitions from "@/views/dashboard/ConversionDefinitions.vue";
import Report from "@/views/dashboard/Report.vue";
import ConversionAnalytics from "@/views/analytics/ConversionAnalytics.vue";

export default [
  {
    path: "/conversions",
    name: "conversions",
    meta: {
      requiresAuth: true,
      title: "Conversões", // Parent title
      roles: "member|client",
      permissions: "view-events",
    },
    children: [
      {
        path: "definitions", // Default child route for /conversions
        name: "definitions", // More specific name
        component: ConversionDefinitions,
        meta: {
          layout: DefaultLayout,

          roles: "member|client",
          title: "Definições de Conversão",
          permissions: "view-events",

        },
      },
      {
        path: "reports", // /conversions/reports
        name: "reports", // Specific name for reports
        component: Report,
        meta: {
          layout: DefaultLayout,
          roles: "member|client",
          permissions: "view-events",
          title: "Relatórios",
        },
      },
      {
        path: "analytics", // /conversions/analytics
        name: "ConversionAnalytics", // Specific name for conversion analytics
        component: ConversionAnalytics,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Análise de Conversão",
          roles: "member|client",
          permissions: "view-events",
        },
      },
    ],
  },
];