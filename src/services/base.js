import axios from "axios";
import i18n from "@/i18n";
import { useToast } from "@/components/ui/toast/use-toast";
const { toast } = useToast()

const api = axios.create({
  baseURL: `${import.meta.env.VITE_PUBLIC_API_URL}/v1`,
  headers: { "App-Type": "0" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 500) {
      toast({
        title: i18n.global.t("internal_error"),
        description: i18n.global.t("try_again_later"),
        variant: 'destructive',
      });
    }

    if (error.response && error.response.status === 422) {
      const fields = []

      Object.entries(error.response.data.errors).forEach(([key, value]) => {
        return (Array.isArray(value))
          ? fields.push(value.join(", "))
          : fields.push(value)
      });

      toast({
        title: i18n.global.t("attention"),
        description: fields.join('<br>'),
        variant: 'destructive',
      });
    }

    if (error.code === "ERR_NETWORK") {
      toast({
        title: i18n.global.t("connection_error"),
        description: i18n.global.t("please_verify_connection"),
        variant: 'destructive',
      });
    }

    if (
      error.response &&
      !error.response.data.success &&
      !error.response.data.errors &&
      error.response.data.message
    ) {
      toast({
        title: i18n.global.t("error_ocurried"),
        description: i18n.global.t(error.response.data.message),
        variant: 'destructive',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
