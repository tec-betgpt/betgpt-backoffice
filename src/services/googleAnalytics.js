import api from './base.js';

export default {
  /**
   * GET /v1/google-analytics
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   */
  async index (params = {}) {
    const { data } = await api.get('/google-analytics', { params })
    return data
  },
}
