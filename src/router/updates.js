import DefaultLayout from "@/layouts/default.vue";
import ProjectAnnotations from "@/views/dashboard/ProjectAnnotations.vue";
import Risk from "@/views/dashboard/Risk.vue";

export default [
  {
    path: "/updates",
    name: "updates",
    meta: {
      requiresAuth: true,
      title: "Gestão",
      roles: "member|client",
      permissions: "access-to-dashboard",
    },
    children: [
      {
        path: "annotations",
        name: "annotations",
        component: ProjectAnnotations,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          title: "Marcos",
          permissions: "access-to-dashboard",
        },
      },
      {
        path: "risk",
        name: "risk",
        component: Risk,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Risco",
          roles: "member|client",
          permissions: "access-to-reports",
        },
      }
    ]
  }
]
