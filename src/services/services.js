import api from './base.js'

export default {
  /**
   * GET /v1/services
   *
   * @param {object} params
   * @param {string|null} params.search
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index (params = {}) {
    const { data } = await api.get('/services', { params })
    return data
  },

  /**
   * POST /v1/services
   */
  async store (body = {}) {
    const { data } = await api.post('/services', body)
    return data
  },

  /**
   * GET /v1/services/:id
   *
   * @param {number} id
   */
  async show (id) {
    const { data } = await api.get(`/services/${id}`)
    return data
  },

  /**
   * PUT /v1/services/:id
   *
   * @param {number} id
   * @param {object} body
   */
  async update (id, body) {
    const { data } = await api.put(`/services/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/services/:id
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/services/${id}`)
    return data
  },

  /**
   * PATCH /v1/services/:id/toggle
   *
   * @param {number} id
   * @param {object} body
   */
  async toggle (id, body) {
    const { data } = await api.patch(`/services/${id}/toggle`, body)
    return data
  },

  /**
   * GET /v1/services/list
   *
   * @param {object} params
   */
  async list (params = {}) {
    const { data } = await api.get('/services/list', { params })
    return data
  }
}
