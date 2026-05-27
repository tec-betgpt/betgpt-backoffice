import api from './base.js';

export default {
  /**
   * POST /v1/recover/finish
   *
   * @param {object} body
   * @param {string} body.email
   * @param {string} body.password
   * @param {string} body.password_confirmation
   * @param {string} body.token
   */
  async finish (body) {
    const { data } = await api.post('/recover/finish', body)
    return data
  }
}
