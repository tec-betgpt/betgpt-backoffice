import axios from "axios";
import i18n from "@/i18n";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  headers: { "App-Type": "0" },
  withCredentials: true,
});

function showDialog(options) {
  Swal.fire({
    title: options.title,
    text: options.subtitle,
    icon: options.type === "critical" ? "error" : "info",
    confirmButtonText: options.assistiveButton,
    width: options.size === "large" ? "600px" : "400px",
  });
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 500) {
      showDialog({
        type: "critical",
        title: i18n.global.t("internal_error"),
        subtitle: i18n.global.t("try_again_later"),
        assistiveButton: i18n.global.t("close"),
      });
    } else if (error.code === "ERR_NETWORK") {
      showDialog({
        type: "critical",
        title: i18n.global.t("connection_error"),
        subtitle: i18n.global.t("please_verify_connection"),
        assistiveButton: i18n.global.t("close"),
        size: "large",
      });
    } else if (
      error.response &&
      !error.response.data.success &&
      !error.response.data.errors &&
      error.response.data.message
    ) {
      showDialog({
        type: "critical",
       title: i18n.global.t("error_ocurried"),
        subtitle: i18n.global.t(error.response.data.message),
        assistiveButton: i18n.global.t("close"),
      });
    }

    return Promise.reject(error);
  }
);

export default api;
