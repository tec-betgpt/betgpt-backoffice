import Conversions from "@/views/dashboard/Conversions.vue";
import ConversionDefinitions from "@/views/dashboard/ConversionDefinitions.vue";
import DefaultLayout from "@/layouts/default.vue";

export default [
  {
    path: "/conversions",
    name: "conversions",
    meta: {
      requiresAuth: true,
      title: "Conversões",
      roles: "member",
      permissions: "access-to-conversion", // I'll use a more specific permission later
    },
    children: [
      {
        path: "list",
        name: "conversionsList",
        component: Conversions,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-conversion",
          title: "Lista de Conversões",
        },
      },
      {
        path: "events",
        name: "events",
        component: ConversionDefinitions,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-events",
          title: "Definições de Conversão",
        },
      },
    ],
  },
];
