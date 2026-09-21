import DefaultLayout from "@/layouts/default.vue";
import Groups from "@/views/dashboard/Groups.vue";
import GroupDetails from "@/views/dashboard/GroupDetails.vue";
import GroupOverviewView from "@/views/dashboard/group/GroupOverviewView.vue";
import GroupProjectsView from "@/views/dashboard/group/GroupProjectsView.vue";
import GroupMembersView from "@/views/dashboard/group/GroupMembersView.vue";
import GroupInvitationsView from "@/views/dashboard/group/GroupInvitationsView.vue";
import GroupConsolidatedView from "@/views/dashboard/group/GroupConsolidatedView.vue";
import GroupAnalyticsView from "@/views/dashboard/group/GroupAnalyticsView.vue";
import GroupFinancialView from "@/views/dashboard/group/GroupFinancialView.vue";

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
        path: "projects",
        name: "groups.projects",
        component: GroupProjectsView,
        meta: { ...groupMeta, title: "Projetos" },
      },
      {
        path: "members",
        name: "groups.members",
        component: GroupMembersView,
        meta: { ...groupMeta, title: "Membros" },
      },
      {
        path: "invitations",
        name: "groups.invitations",
        component: GroupInvitationsView,
        meta: { ...groupMeta, title: "Convites" },
      },
      {
        path: "consolidated",
        name: "groups.consolidated",
        component: GroupConsolidatedView,
        meta: { ...groupMeta, title: "Consolidado" },
      },
      {
        path: "analytics",
        name: "groups.analytics",
        component: GroupAnalyticsView,
        meta: { ...groupMeta, title: "Analytics" },
      },
      {
        path: "financial",
        name: "groups.financial",
        component: GroupFinancialView,
        meta: { ...groupMeta, title: "Financeiro" },
      },
    ],
  },
];
