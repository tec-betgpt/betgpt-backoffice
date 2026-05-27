import api from './base';

export default {
  /**
   * GET /v1/roles
   *
   * @param {object} params
   */
  async index (params = {}) {
    const { data } = await api.get('/roles', { params })
    return data
  },

  /**
   * POST /v1/roles
   *
   * @param {object} body
   * @param {string} body.title
   * @param {string|number} body.filter_id
   * @param {Array<number>} body.permissions
   */
  async store (body) {
    const { data } = await api.post('/roles', body)
    return data
  },

  /**
   * GET /v1/roles/{id}
   *
   * @param {number} id
   */
  async show (id) {
    const { data } = await api.get(`/roles/${id}`)
    return data
  },

  /**
   * PUT /v1/roles/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {Array<number>} body.permissions
   */
  async update (id, body) {
    const { data } = await api.put(`/roles/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/roles/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/roles/${id}`)
    return data
  }
}
