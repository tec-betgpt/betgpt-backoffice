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
  async login (body:{}) {
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
  async twoFactor (body:{}) {
    const { data } = await api.post('/auth/login/two-factor', body, { withCredentials: true })
    return data
  },

  /**
   * GET /v1/auth/login/two-factor/
   *
   */
  async getResendTwoFactor () {
    const { data } = await api.get(`/auth/login/two-factor/`)
    return data
  },

  /**
   * GET /v1/auth/validate-recovery-code/
   *
   */
  async getValidateRecoveryCode () {
    const { data } = await api.get(`/auth/validate-recovery-code/`)
    return data
  },

  /**
   * POST /v1/auth/validate-recovery-code
   *
   * @param {object} body
   * @param {string} body.recovery_code
   */
  async validateRecoveryCode (body:{}) {
    const { data } = await api.post('/auth/validate-recovery-code', body, { withCredentials: true })
    return data
  },

  /**
   * POST /auth/active-two-factor
   * 
   * @param {object} body
   * @param {string} body.two_factor_code
   * @param {string} body.type
   */

  async activeTwoFactor(body:{}){
    const {data} = await api.post('/auth/active-two-factor',body)
    return data
  },
  /**
   * GET /v1/auth/security-questions
   */
  async getSecurityQuestions () {
    const { data } = await api.get('/auth/security-questions')
    return data
  },

  /**
   * POST /v1/auth/security-questions
   *
   * @param {object} body
   * @param {string} body.question1
   * @param {string} body.answer1
   * @param {string} body.question2
   * @param {string} body.answer2
   */
  async saveSecurityQuestions (body:{}) {
    const { data } = await api.post('/auth/security-questions', body)
    return data
  },

  /**
   * POST /v1/auth/recover/questions
   *
   * @param {object} body
   * @param {string} body.document_number
   */
  async recoverQuestions (body:{}) {
    const { data } = await api.post('/auth/recover/questions', body)
    return data
  },

  /**
   * POST /v1/auth/recover/validate
   *
   * @param {object} body
   * @param {string} body.cpf
   * @param {string} body.answer1
   * @param {string} body.answer2
   */
  async recoverAnswers (body:{}) {
    const { data } = await api.post('/auth/recover/validate', body)
    return data
  },

   /**
   * POST /v1/auth/validate-two-factor
   *
   * @param {object} body
   * @param {string} body.two_factor_code
   * @param {string} body.type
   */
  async validateTwoFactor(body:{}) {
    const { data } = await api.post('/auth/validate-two-factor', body)
    return data
  },

  /**
   * GET /v1/auth/account-status
   */
  async getAccountStatus () {
    const { data } = await api.get('/auth/account-status')
    return data
  },

  /**
   * POST /v1/auth/logout
   */
  async logout () {
    await api.post('/auth/logout', {}, { withCredentials: true })
  },


}
