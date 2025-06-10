import api from './base.js';

export default {
  /**
   * GET /v1/auth/user
   */
  async user () {
    const { data } = await api.get('/auth/user', { withCredentials: true })
    return data
  },

  /**
   * POST /v1/auth/login
   *
   * @param {object} body
   * @param {string} body.email
   * @param {string} body.password
   */
  async login (body) {
    const { data } = await api.post('/auth/login', body, { withCredentials: true })
    return data
  },

  /**
   * POST /v1/auth/login/two-factor
   *
   * @param {object} body
   * @param {string} body.id
   * @param {string} body.two_factor_code
   */
  async twoFactor (body) {
    const { data } = await api.post('/auth/login/two-factor', body, { withCredentials: true })
    return data
  },

  /**
   * GET /v1/auth/login/two-factor/{id}
   *
   * @param {number} id
   */
  async getLoginTwoFactor (id) {
    const { data } = await api.get(`/auth/login/two-factor/${id}`)
    return data
  },

  /**
   * GET /v1/auth/validate-recovery-code/{id}
   *
   * @param {number} id
   */
  async getValidateRecoveryCode (id) {
    const { data } = await api.get(`/auth/validate-recovery-code/${id}`)
    return data
  },

  /**
   * POST /v1/auth/validate-recovery-code
   *
   * @param {object} body
   * @param {string} body.email
   * @param {string} body.password
   * @param {string} body.recovery_code
   */
  async validateRecoveryCode (body) {
    const { data } = await api.post('/auth/validate-recovery-code', body, { withCredentials: true })
    return data
  },

  /**
   * POST /v1/auth/logout
   */
  async logout () {
    await api.post('/auth/logout', {}, { withCredentials: true })
  },


}
