import api from "./base.js";

export default {
  /**
   * GET /v1/segments/groups
   */
  async groups(params = {}) {
    const { data } = await api.get("/segments/groups", { params });
    return data;
  },

  /**
   * GET /v1/segments
   */
  async index(params = {}) {
    const { data } = await api.get("/segments", { params });
    return data;
  },

  /**
   * POST /v1/segments
   */
  async create(payload) {
    const { data } = await api.post("/segments", payload);
    return data;
  },

  /**
   * GET /v1/segments/:id
   */
  async show(id) {
    const { data } = await api.get(`/segments/${id}`);
    return data;
  },

  /**
   * PUT /v1/segments/:id
   */
  async update(id, payload) {
    const { data } = await api.put(`/segments/${id}`, payload);
    return data;
  },

  /**
   * DELETE /v1/segments/:id
   */
  async delete(id) {
    const { data } = await api.delete(`/segments/${id}`);
    return data;
  },
};
