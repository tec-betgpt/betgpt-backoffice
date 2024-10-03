import axios from "axios";
import i18n from "@/i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  headers: { "App-Type": "0" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
