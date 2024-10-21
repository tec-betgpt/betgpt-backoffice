import { createApp } from "vue";
import { createPinia } from "pinia";
import i18n from "./i18n";
import App from "./App.vue";
import router from "./router";
import VueTippy from "vue-tippy";
import { toCurrency } from "./filters/currencyFilter";
import "tippy.js/dist/tippy.css";
import { useAuthStore } from "@/stores/auth";

import "./assets/styles/main.css";

const app = createApp(App);
const pinia = createPinia();

app.config.globalProperties.$toCurrency = toCurrency;

app.use(VueTippy, {
  directive: "tippy",
  component: "tippy",
});

app.use(pinia);
app.use(router);
app.use(i18n);

const authStore = useAuthStore();
authStore.restoreSession();

app.mount("#app");
