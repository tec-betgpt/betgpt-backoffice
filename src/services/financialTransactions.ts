import api from "./base.js";

export default {
  async index(params: Record<string, unknown> = {}) {
    const { data } = await api.get("/financial-transactions", { params });
    return data;
  },

  async store(body: Record<string, unknown>) {
    const { data } = await api.post("/financial-transactions", body);
    return data;
  },

  async show(id: number) {
    const { data } = await api.get(`/financial-transactions/${id}`);
    return data;
  },

  async update(id: number, body: Record<string, unknown>) {
    const { data } = await api.put(`/financial-transactions/${id}`, body);
    return data;
  },

  async destroy(id: number) {
    const { data } = await api.delete(`/financial-transactions/${id}`);
    return data;
  },
};
