import DefaultLayout from "@/layouts/default.vue";
import Groups from "@/views/dashboard/Groups.vue";
import GroupDetails from "@/views/dashboard/GroupDetails.vue";

export default [
  {
    path: "/groups",
    name: "groups",
    component: Groups,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Grupos",
      roles: "member",
      permissions: "access-to-project-groups",
    },
  },
  {
    path: "/groups/:id",
    name: "groups.show",
    component: GroupDetails,
    meta: {
      layout: DefaultLayout,
      requiresAuth: true,
      title: "Detalhes do Grupo",
      roles: "member",
      permissions: "access-to-project-groups",
    },
  },
];
