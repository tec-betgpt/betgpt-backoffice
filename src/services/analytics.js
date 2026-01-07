import api from './base.js'

export default {
  /**
   * GET /v1/analytics
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   */
  async index (params = {}) {
    const { data } = await api.get('/analytics', { params })
    return data
  },

  /**
   * GET /v1/analytics/return-general
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {string} params.channel_group
   */
  async returnGeneral (params = {}) {
    const { data } = await api.get('/analytics/return-general', { params })
    return data
  },
}
