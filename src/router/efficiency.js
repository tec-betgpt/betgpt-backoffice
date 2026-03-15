import DefaultLayout from "@/layouts/default.vue";
import ConversionDefinitions from "@/views/dashboard/ConversionDefinitions.vue";
import Report from "@/views/dashboard/Report.vue";
import ConversionAnalytics from "@/views/dashboard/ConversionAnalytics.vue";

export default [
  {
    path: "/efficiency",
    name: "efficiency",
    meta: {
      requiresAuth: true,
      title: "Desempenho", // Parent title
      roles: "member|client",
      permissions: "view-events",
    },
    children: [
      {
        path: "conversions", // Default child route for /conversions
        name: "conversions", // More specific name
        component: ConversionDefinitions,
        meta: {
          layout: DefaultLayout,

          roles: "member|client",
          title: "Conversões",
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
          title: "Resultados",
          roles: "member|client",
          permissions: "view-events",
        },
      },
    ],
  },
];