import Sectors from "@/views/dashboard/Sectors.vue";
import DefaultLayout from "@/layouts/default.vue";
import CostCenters from "@/views/dashboard/CostCenters.vue";
import Financial from "@/views/dashboard/Financial.vue";
import FinancialResourceUsage from "@/views/dashboard/FinancialResourceUsage.vue";
import FinancialLedger from "@/views/dashboard/FinancialLedger.vue";

export default [
  {
    path: "/financial",
    name: "financial",
    meta: {
      requiresAuth: true,
      title: "Financeiro",
      roles: "member",
      permissions: "access-to-finance",
    },
    children: [
      {
        path: "sectors",
        name: "sectors",
        component: Sectors,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Setores",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "costs",
        name: "costs",
        component: CostCenters,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Custos",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "registers",
        name: "registers",
        component: Financial,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Financeiro",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "resource-usage",
        name: "financial.resource-usage",
        component: FinancialResourceUsage,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Uso de recursos",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
      {
        path: "ledger",
        name: "financial.ledger",
        component: FinancialLedger,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Extrato do ledger",
          roles: "member",
          permissions: "access-to-finance",
        },
      },
    ],
  },
]
