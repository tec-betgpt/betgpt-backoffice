import api from './base.js'

export default {
  /**
   * POST /v1/token/check
   *
   * @param {object} body
   * @param {string} body.key
   * @param {string} body.token
   */
  async check (body) {
    const { data } = await api.post('/token/check', body)
    return data
  },

  /**
   * POST /v1/token/send
   *
   * @param {object} body
   * @param {string} body.type
   * @param {string} body.action
   */
  async send (body) {
    const { data } = await api.post('/token/send', body)
    return data
  }
}
