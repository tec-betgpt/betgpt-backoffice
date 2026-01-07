import Segments from "@/views/dashboard/Segments.vue";
import DefaultLayout from "@/layouts/default.vue";
import TargetAudience from "@/views/dashboard/TargetAudience.vue";
import Players from "@/views/dashboard/Players.vue";
import UtmTracks from "@/views/dashboard/UtmTracks.vue";
import Export from "@/views/dashboard/Export.vue";

export default [
  {
    path: "/audiences",
    name: "audiences",
    meta: {
      requiresAuth: true,
      title: "Audiências",
      roles: "member",
      permissions: "access-to-management",
    },
    children: [
      {
        path: "segments",
        name: "segments",
        component: Segments,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "view-segments",
          title: "Segmentos",
        },
      },
      {
        path: "target-audiences",
        name: "target-audiences",
        component: TargetAudience,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "view-segments",
          title: "Audiências Alvo",
        },
      },
      {
        path: "clients",
        name: "clients",
        component: Players,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "player-registrations",
          title: "Clientes",
        },
      },
      {
        path: "attributions",
        name: "attributions",
        component: UtmTracks,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member|client",
          permissions: "access-to-parameter-tracking",
          title: "Rastreamentos UTM",
        },
      },
      {
        name: "exports",
        path: "exports",
        component: Export,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          roles: "member",
          permissions: "access-to-exportations",
          title: "Exportações",
        },
      },
    ],
  },
]
