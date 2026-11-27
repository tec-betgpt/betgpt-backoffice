import ConfigurationLayout from "@/views/configurations/Layout.vue";
import ConfigurationProfile from "@/views/configurations/Profile.vue";
import DefaultLayout from "@/layouts/default.vue";
import ConfigurationPreferences from "@/views/configurations/Preferences.vue";
import ConfigurationSecurity from "@/views/configurations/Security.vue";
import ConfigurationNotifications from "@/views/configurations/Notifications.vue";
import ConfigurationConfirmEmailChange from "@/views/configurations/ConfirmEmailChange.vue";
import ServiceConsumeds from "@/views/configurations/ServiceConsumeds.vue";
import Invoices from "@/views/configurations/Invoices.vue";
import InvoiceShow from "@/views/configurations/InvoiceShow.vue";
import MarketingApiKeys from "@/views/configurations/MarketingApiKeys.vue";

export default [
  {
    path: "/configurations",
    component: ConfigurationLayout,
    meta: {
      requiresAuth: true,
      title: "Configurações",
      roles: "member|client",
    },
    children: [
      { path: "", redirect: "/configurations/profile" },
      {
        path: "profile",
        name: "configurations.profile",
        component: ConfigurationProfile,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Perfil",
          roles: "member|client",
        },
      },
      {
        path: "preferences",
        name: "configurations.preferences",
        component: ConfigurationPreferences,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Preferências",
          roles: "member|client",
        },
      },
      {
        path: "security",
        name: "configurations.security",
        component: ConfigurationSecurity,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Segurança",
          roles: "member|client",
        },
      },
      {
        path: "notifications",
        name: "configurations.notifications",
        component: ConfigurationNotifications,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Notificações",
          roles: "member|client",
        },
      },
      {
        path: "confirm-email-change/:token",
        name: "configurations.confirm-email-change",
        component: ConfigurationConfirmEmailChange,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Confirmação de E-mail",
          roles: "member|client",
        },
      },
      {
        path: "api-keys",
        name: "configurations.api-keys",
        component: MarketingApiKeys,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "API Keys",
          roles: "member|client",
        },
      },
      {
        path: "mcp",
        redirect: { name: "mcp" },
      },
      {
        path: "service-consumeds",
        name: "service-consumeds.index",
        component: ServiceConsumeds,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Consumo",
          roles: "member|client",
        },
      },
      {
        path: "invoices",
        name: "invoices.index",
        component: Invoices,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Faturas",
          roles: "member|client",
        },
      },
      {
        path: "invoices/:id",
        name: "invoices.show",
        component: InvoiceShow,
        meta: {
          layout: DefaultLayout,
          requiresAuth: true,
          title: "Fatura",
          roles: "member|client",
          navRoute: "invoices.index",
        },
      },
    ],
  },
]
