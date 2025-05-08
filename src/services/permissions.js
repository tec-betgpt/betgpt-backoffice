import api from './base.js';

export default {
  /**
   * GET /v1/permissions
   *
   * @param {object} params
   */
  async index (params = {}) {
    const { data } = await api.get('/permissions', { params })
    return data
  }
}
