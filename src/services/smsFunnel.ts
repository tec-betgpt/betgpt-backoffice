import api from './base.js'

export default {
  /**
   * GET /v1/sms-funnel
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {'all'|'campaigns'|'broadcasts'} [params.section]
   * @param {Array<object>} [params.campaign_search]
   * @param {Array<object>} [params.broadcast_search]
   * @param {number} [params.campaign_page]
   * @param {number} [params.broadcast_page]
   */
  async index (params = {}) {
    const { data } = await api.get('/sms-funnel', { params })
    return data
  },
}
