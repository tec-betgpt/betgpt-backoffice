import api from './base.js'

export default {
  /**
   * GET /v1/cost-centers
   *
   * @param {Partial<object>} params
   * @param {string|number|null} params.filter_id
   * @param {string|null} params.sort_by
   * @param {string|null} params.sort_order
   * @param {string|null} params.find_name
   * @param {number|null} params.per_page
   */
  async index (params = {}) {
    const { data } = await api.get('/cost-centers', { params })
    return data
  },

  /**
   * GET /v1/cost-centers/{id}
   *
   * @param {number} id
   */
  async show (id) {
    const { data } = await api.get(`/cost-centers/${id}`)
    return data
  },

  /**
   * POST /v1/cost-centers
   *
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.otherName
   * @param {number} body.sector_id
   */
  async store (body) {
    const { data } = await api.post('/cost-centers', body)
    return data
  },

  /**
   * DELETE /v1/cost-centers/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/cost-centers/${id}`)
    return data
  },

  /**
   * PUT /v1/cost-centers/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {number} body.sector_id
   * @param {string} body.otherName
   * @param {number} body.user_id
   */
  async update (id, body) {
    const { data } = await api.put(`/cost-centers/${id}`, body)
    return data
  },
}
