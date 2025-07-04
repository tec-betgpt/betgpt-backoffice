import api from "./base";

export default {
  /**
   * GET /v1/segments/groups
   *
   * @param {object} params
   */
  async groups(params = {}) {
    const { data } = await api.get("/segments/groups", { params });
    return data;
  },

  /**
   * GET /v1/segments
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.find_name
   * @param {string} params.sort_by
   * @param {string} params.sort_order
   * @param {number} params.page
   */
  async index(params = {}) {
    const { data } = await api.get("/segments", { params });
    return data;
  },

  /**
   * POST /v1/segments
   *
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.description
   * @param {string|number} payload.filter_id
   * @param {object} payload.conditions
   */
  async create(payload) {
    const { data } = await api.post("/segments", payload);
    return data;
  },

  /**
   * GET /v1/segments/{id}
   *
   * @param {number} id
   */
  async show(id) {
    const { data } = await api.get(`/segments/${id}`);
    return data;
  },

  /**
   * PUT /v1/segments/{id}
   *
   * @param {number} id
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.description
   * @param {string|number} payload.filter_id
   * @param {object} payload.conditions
   */
  async update(id, payload) {
    const { data } = await api.put(`/segments/${id}`, payload);
    return data;
  },

  /**
   * DELETE /v1/segments/{id}
   *
   * @param {number} id
   */
  async delete(id) {
    const { data } = await api.delete(`/segments/${id}`);
    return data;
  },

  async contacts(segmentId, params = {}) {
    const { data } = await api.get(`/segments/${segmentId}/contacts`);
    return data;
  },

  async forceUpdate(segmentId, params = {}) {
    const { data } = await api.post(`/segments/${segmentId}/force-update`);
    return data;
  },
};
