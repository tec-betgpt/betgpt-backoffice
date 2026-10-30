import DefaultLayout from "@/layouts/default.vue";
import LinkEngine from "@/views/dashboard/LinkEngine.vue";
import Links from "@/views/dashboard/Links.vue";

const trafficMeta = {
  layout: DefaultLayout,
  requiresAuth: true,
  roles: "member",
  permissions: "access-to-marketing",
};

export default [
  {
    path: "/marketing/links",
    redirect: { name: "links" },
  },
  {
    path: "/marketing/link-engine",
    redirect: { name: "link-engine" },
  },
  {
    path: "/trafego",
    name: "traffic",
    redirect: { name: "link-engine" },
    meta: {
      requiresAuth: true,
      title: "Tráfego",
      roles: "member",
      permissions: "access-to-marketing",
    },
    children: [
      {
        path: "monitoramento",
        name: "link-engine",
        component: LinkEngine,
        meta: {
          ...trafficMeta,
          title: "Monitoramento",
        },
      },
      {
        path: "links",
        name: "links",
        component: Links,
        meta: {
          ...trafficMeta,
          title: "Gestão de Links",
        },
      },
    ],
  },
];
