import api from './base.js';

export default {
  /**
   * GET /v1/utm-tracks
   *
   * @param {object} params
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {Array<string>} params.search
   * @param {string} params.filter_id
   * @param {Array<string>} params.type
   */
  async index (params = {}) {
   const { data } = await api.get('/utm-tracks', { params })
   return data
  }
}
