import api from './base.js'

export default {
  /**
   * GET /v1/target-audiences
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {Array<string>} params.search
   * @param {string} params.order_by
   * @param {string} params.type_order
   * @param {number} params.per_page
   * @param {number} params.page
   */
  async index (params = {}) {
    const { data } = await api.get('/target-audiences', { params })
    return data.data
  },

  /**
   * POST /v1/target-audiences
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.description
   * @param {number} payload.project_id
   * @param {Array<object>} payload.conditions
   * @param {Array<string>} [payload.sync_providers]
   */
  async store (payload) {
    const { data } = await api.post('/target-audiences', payload)
    return data
  },

  /**
   * GET /v1/target-audiences/{id}
   * @param {object} params
   * @param {number} params.id
   */
  async show (params = {}) {
    const { data } = await api.get(`/target-audiences/${params.id}`)
    return data.data
  },

  /**
   * PUT /v1/target-audiences/{id}
   * @param {number} id
   * @param {object} payload
   * @param {string} [payload.name]
   * @param {string} [payload.description]
   * @param {Array<object>} [payload.conditions]
   * @param {Array<string>} [payload.sync_providers]
   */
  async update (id, payload) {
    const { data } = await api.put(`/target-audiences/${id}`, payload)
    return data
  },

  /**
   * DELETE /v1/target-audiences/{id}
   * @param {number} id
   */
  async destroy (id) {
    await api.delete(`/target-audiences/${id}`)
  },

  /**
   * GET /v1/target-audiences/conditions
   */
  async getAvailableConditions () {
    const { data } = await api.get('/target-audiences/conditions')
    return data.data
  }
}
  