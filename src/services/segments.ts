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
   * @param {number} params.per_page
   */
  async index(params = {}) {
    const { data } = await api.get("/segments", { params });
    return data;
  },

  /**
   * POST /v1/segments
   *
   * @param {Array<{
   *   name: string,
   *   description: string,
   *   filter_id: string|number,
   *   conditions: object
   * }>} payload
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
   * @param {Array<{
   *   name: string,
   *   description: string,
   *   filter_id: string|number,
   *   conditions: object
   * }>} payload
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

  /**
   * GET /v1/segments/{id}/contacts
   *
   * @param {number} segmentId
   * @param {object} params
   */
  async contacts(segmentId, params = {}) {
    const { data } = await api.get(`/segments/${segmentId}/contacts`, {
      params,
    });
    return data;
  },

  /**
   * GET /v1/segments/{id}/contacts (export)
   *
   * @param {number} segmentId
   * @param {object} params
   */
  async exportContacts(segmentId, params = {}) {
    return api.get(`/segments/${segmentId}/contacts`, {
      params: { ...params, export: 1 },
      responseType: "blob",
    });
  },

  /**
   * POST /v1/segments/{id}/force-update
   *
   * @param {number} segmentId
   * @param {object} params
   */
  async forceUpdate(segmentId, params = {}) {
    const { data } = await api.post(`/segments/${segmentId}/force-update`, {
      params,
    });
    return data;
  },

  /**
   * GET /v1/segments/{id}/export
   * Exporta um segmento como JSON
   *
   * @param {object} params
   * @param {number} params.project_id
   * @param {Array<number>} params.target_project_ids
   * @param {Array<number>} params.segment_ids
   */
  async export(params) {
    const { data } = await api.post(`/segments/export`,{
      project_id : params.project_id,
      target_project_ids : params.target_project_ids,
      segment_ids : params.segment_ids
    });
    return data;
  },
    /**
     * POST /v1/segments/audience
     *
     * @param {object} body
     * @param {number} body.filter_id
     * @param {Array<number>} body.audience_id
     * @param {number} body.segment_id
     */
    async addAudience(body = {}) {
      const { data } = await api.post(`/segments/audience`, body)
        return data;
    }
};
