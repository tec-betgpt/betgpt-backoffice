import api from "./base.js";

export default {
  /**
   * GET /v1/permissions
   */
  async index (params = {}) {
    const { data } = await api.get('/permissions', { params })
    return data
  },

  /**
   * POST /v1/permissions
   */
  async store (body = {}) {
    const { data } = await api.post('/permissions', body)
    return data
  },

  /**
   * POST /v1/permissions/:id
   */
  async show (id) {
    const { data } = await api.get(`/permissions/${id}`)
    return data
  },

  /**
   * PUT /v1/permissions/:id
   */
  async update (id, body = {}) {
    const { data } = await api.put(`/permissions/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/permissions/:id
   */
  async destroy (id) {
    const { data } = await api.delete(`/permissions/${id}`)
    return data
  },

  /**
   * GET /v1/permissions/list
   */
  async list (params = {}) {
    const { data } = await api.get('/permissions/list', { params })
    return data
  }
}
