import api from './base.js';

export default {
  /**
   * GET /v1/players
   *
   * @param {object} params
   * @param {number} params.size
   * @param {number} params.page
   * @param {Array<string>} params.search
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {string} params.filter_id
   */
  async index (params = {}) {
    const { data } = await api.get('/players', { params })
    return data
  }
}
