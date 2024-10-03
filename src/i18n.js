// src/i18n.js
import { createI18n } from "vue-i18n";
import ptBR from "./langs/pt_BR.json";

const messages = {
  pt_BR: ptBR,
};

const i18n = createI18n({
  legacy: false,
  locale: "pt_BR",
  fallbackLocale: "pt_BR",
  messages,
});

export default i18n;
