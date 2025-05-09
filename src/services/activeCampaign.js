import api from './base.js'

export default {
  /**
   * GET /v1/active-campaign
   * 
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.order_by
   * @param {string} params.type_order
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {Array<string>} params.search
   */
  async index(params = {}) {
    const {data} = await api.get('/active-campaign', {params})
    return data
  }
}
