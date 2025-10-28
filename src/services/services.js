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
}
