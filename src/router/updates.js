import DefaultLayout from "@/layouts/default.vue";
import ProjectAnnotations from "@/views/dashboard/ProjectAnnotations.vue";

export default [
  {
    path: "/updates",
    name: "updates",
    meta: {
      requiresAuth: true,
      title: "Atualizações",
      roles: "member|client",
      permissions: "access-to-dashboard",
    },
    children: [
      {
        path: "/annotations",
        name: "annotations",
        component: ProjectAnnotations,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          title: "Marcos",
          permissions: "access-to-dashboard",
        },
      }
    ]
  }
]
