import api from './base.js'

export default {
  /**
   * GET /v1/user-logins
   */
  async index (params = {}) {
    const { data } = await api.get('/user-logins', { params })
    return data
  }
}
