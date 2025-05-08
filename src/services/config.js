import api from './base.js';

export default {
  /**
   * GET /v1/configs
   */
  async index () {
    const { data } = await api.get('/configs')
    return data
  }
}
