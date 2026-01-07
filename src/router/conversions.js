import DefaultLayout from "@/layouts/default.vue";
import ConversionDefinitions from "@/views/dashboard/ConversionDefinitions.vue";

export default [
  {
    path: "/conversions",
    name: "conversions",
    meta: {
      requiresAuth: true,
      title: "Conversões",
      roles: "member",
      permissions: "view-events",
    },
  },
  {
    path: "/conversions",
    name: "conversions",
    component: ConversionDefinitions,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      roles: "member",
      permissions: "view-events",
      title: "Definições de Conversão",
    },
  },
];
