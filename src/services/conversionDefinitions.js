import api from './base.js'

export default {
  /**
   * GET /v1/conversion-definitions
   *
   * @param {object} params
   * @param {string} params.filter_id
   */
  async index (params = {}) {
    const { data } = await api.get('/conversion-definitions', { params })
    return data
  },

  /**
   * POST /v1/conversion-definitions
   *
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.description
   * @param {string} body.type
   * @param {boolean} body.is_primary
   * @param {boolean} body.is_return_report
   * @param {string} body.metric_source_type
   * @param {string} body.conversion_category
   * @param {string} body.project_id
   * @param {string} body.conversion_value_field
   * @param {Array<object>} body.conditions
   */
  async store (body) {
    const { data } = await api.post('/conversion-definitions', body)
    return data
  },

  /**
   * GET /v1/conversion-definitions/{id}
   *
   * @param {number} id
   */
  async show (id) {
    const { data } = await api.get(`/conversion-definitions/${id}`)
    return data
  },

  /**
   * PUT /v1/conversion-definitions/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.description
   * @param {string} body.type
   * @param {boolean} body.is_primary
   * @param {boolean} body.register_in_return
   * @param {string} body.project_id
   * @param {string} body.conversion_value_field
   * @param {string} body.channel_group
   * @param {Array<object>} body.conditions
   */
  async update (id, body) {
    const { data } = await api.put(`/conversion-definitions/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/conversion-definitions/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/conversion-definitions/${id}`)
    return data
  },
    /**
     *
     * @param {object} params
     * @param {string} params.filter_id
     * @param {string} params.find_name
     *
     */
  async segments (params) {
      const { data } = await api.get('/conversion-definitions/segments', {params})
      return data
  },

    /**
     * @returns {Promise<any>}
     */
    async values () {
      const { data } = await api.get('/conversion-definitions/values')
      return data
    }
}
