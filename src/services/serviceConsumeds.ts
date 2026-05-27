import api from './base';

export default {
  /**
   * GET /v1/service-consumeds
   *
   * @param {object|null} params
   * @param {string} params.to
   * @param {string} params.from
   */
  async index(params = {}) {
    const {data} = await api.get('/service-consumeds', {params})
    return data
  },
}
