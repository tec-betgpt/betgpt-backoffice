import api from "./base";
import axios from "axios";

const ReportsService = {
  index: async (params) => {
    const response = await api.get("/generated-reports", { params });
    return response.data.data;
  },

  store: async (params) => {
    const response = await api.post("/generated-reports", params);
    return response.data;
  },

  destroy: async (id) => {
    const response = await api.delete(`generated-reports/${id}`);
    return response.data;
  },

  download: async (url) => {
    const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_URL}${url}`;
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = '';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  projectReturnReports: async (params) => {
    const response = await api.get("/project-return-reports", { params });
    return response.data.data;
  },
};

export default ReportsService;