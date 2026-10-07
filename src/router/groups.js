import DefaultLayout from "@/layouts/default.vue";
import Groups from "@/views/dashboard/Groups.vue";
import GroupDetails from "@/views/dashboard/GroupDetails.vue";
import GroupOverviewView from "@/views/dashboard/group/GroupOverviewView.vue";
import GroupManagementView from "@/views/dashboard/group/GroupManagementView.vue";

const groupMeta = {
  layout: DefaultLayout,
  requiresAuth: true,
};

export default [
  {
    path: "/groups",
    name: "groups",
    component: Groups,
    meta: { ...groupMeta, title: "Grupos" },
  },
  {
    path: "/groups/:id",
    name: "groups.show",
    component: GroupDetails,
    redirect: (to) => ({ name: "groups.overview", params: to.params }),
    meta: { ...groupMeta, title: "Detalhes do Grupo" },
    children: [
      {
        path: "overview",
        name: "groups.overview",
        component: GroupOverviewView,
        meta: { ...groupMeta, title: "Visão geral" },
      },
      {
        path: "management",
        name: "groups.management",
        component: GroupManagementView,
        meta: { ...groupMeta, title: "Gerenciamento" },
      },
    ],
  },
];
