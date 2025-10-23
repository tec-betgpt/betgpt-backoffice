import api from './base';

export default {
  /**
   * GET /v1/sectors
   *
   * @param {object|null} params
   * @param {string} params.filter_id
   * @param {string} params.find_name
   * @param {string} params.sort_by
   * @param {string} params.sort_order
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index (params = {}) {
    const { data } = await api.get('/sectors', { params })
    return data
  },

  /**
   * POST /v1/sectors
   *
   * @param {object} body
   * @param {string} body.name
   * @param {number} body.project_id
   */
  async store (body) {
    const { data } = await api.post('/sectors', body)
    return data
  },

  /**
   * PUT /v1/sectors/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {number} body.project_id
   * @param {number} body.user_id
   */
  async update (id, body) {
    const { data } = await api.put(`/sectors/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/sectors/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/sectors/${id}`)
    return data
  }
}
