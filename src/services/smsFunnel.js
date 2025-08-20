import api from './base.js'

export default {
  /**
   * GET /v1/sms-funnel
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
    const { data } = await api.get('/sms-funnel', { params })
    return data
  },
}
