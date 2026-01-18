import api from "./base";
import axios from "axios";

const ReportsService = {
  index: async (params) => {
    const response = await api.get("/conversion-definitions/generated-reports", { params });
    return response.data.data;
  },

  store: async (params) => {
    const response = await api.post("/conversion-definitions/generated-reports", params);
    return response.data;
  },

  destroy: async (id) => {
    const response = await api.delete(`/conversion-definitions/generated-reports/${id}`);
    return response.data;
  },

  download: async (url) => {
    const response = await axios.get(url);
    return response.data;
  },

  projectReturnReports: async (params) => {
    const response = await api.get("/conversion-definitions/project-return-reports", { params });
    return response.data.data;
  },
};

export default ReportsService;