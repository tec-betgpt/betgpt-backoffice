import api from './base.js';

export default {
  /**
   * GET /v1/projects
   *
   * @param {object} params
   * @param {number} params.project_id
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params = {}) {
    const { data } = await api.get('/protection-list-reports', { params })
    return data
  },

  /**
   * @param {number }id
   * @returns {Promise<any>}
   */
  async show(id) {
    const { data } = await api.get(`/protection-list-reports/${id}`)
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async destroy(id) {
    const { data } = await api.delete(`/protection-list-reports/${id}`)
    return data
  }
}


