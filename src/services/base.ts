import axios from "axios";
import qs from "qs";
import i18n from "@/i18n";
import { toast } from "vue-sonner";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_PUBLIC_API_URL}/v1`,
  headers: { "App-Type": "0" },
  withCredentials: true,
  paramsSerializer: (params) => {
    return qs.stringify(params, { encode: true });
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 500) {
      toast.error(i18n.global.t("internal_error"), { description: i18n.global.t("try_again_later") });
    }

    if (error.response && error.response.status === 422) {
      const fields: string[] = [];

      Object.entries(error.response.data.errors ?? {}).forEach(([key, value]) => {
        return Array.isArray(value)
          ? fields.push(value.join(", "))
          : fields.push(String(value));
      });

      if (fields.length) {
        toast.error(i18n.global.t("attention"), { description: fields.join("<br>") });
      }
    }

    if (error.code === "ERR_NETWORK") {
      toast.error(i18n.global.t("connection_error"), { description: i18n.global.t("please_verify_connection") });
    }

    if (
      error.response &&
      !error.response.data.success &&
      !error.response.data.errors &&
      error.response.data.message
    ) {
      toast.error(i18n.global.t("error_ocurried"), { description: i18n.global.t(error.response.data.message) });
    }

    return Promise.reject(error);
  }
);

export default api;
