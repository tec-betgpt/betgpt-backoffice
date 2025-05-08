import api from './base.js'

export default {
  /**
   * GET /v1/insights
   *
   * @param {object} params
   * @param {Array<string>} params.search
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   */
  async index (params = {}) {
    const { data } = await api.get('/insights', { params })
    return data
  },

  /**
   * POST /v1/insights
   *
   * @param {object} body
   * @param {string} body.message
   * @param {string} body.signature
   */
  async store (body) {
    const { data } = await api.post('/insights', body)
    return data
  },

  /**
   * PUT /v1/insights/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.message
   * @param {string} body.signature
   */
  async update (id, body) {
    const { data } = await api.put(`/insights/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/insights/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/insights/${id}`)
    return data
  }
}
