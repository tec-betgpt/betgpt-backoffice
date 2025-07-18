import api from './base.js';

export default {
  /**
   * GET /v1/home
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   */
  async index (params = {}) {
    const {data} = await api.get('/home', { params })
    return data
  },

  async layout (layout = {}) {
    const {data} = await api.post('/home/layout', { layout })
    return data
  }
}