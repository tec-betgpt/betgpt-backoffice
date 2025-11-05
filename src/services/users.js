import api from './base.js'

export default {
  /**
   * POST /v1/users/disable-two-factor
   *
   * @param {object} body
   * @param {string} body.two_factor_code
   */
  async disableTwoFactor (body) {
    const { data } = await api.post('/users/disable-two-factor', body)
    return data
  },

  /**
   * POST /v1/users/active-two-factor
   *
   * @param {object} body
   * @param {string} body.type
   */
  async activeTwoFactor (body) {
    const { data } = await api.post('/users/active-two-factor', body)
    return data
  },

  /**
   * POST /v1/users/confirm-email-change/{token}
   *
   * @param {string} token
   * @param {object} body
   */
  async confirmEmailChange (token, body) {
    const { data } = await api.post(`/users/confirm-email-change/${token}`, body)
    return data
  },

  /**
   * POST /v1/users/update-notifications
   *
   * @param {object} body
   * @param {boolean} body.communication_emails
   * @param {boolean} body.marketing_emails
   * @param {boolean} body.social_emails
   * @param {boolean} body.security_emails
   */
  async updateNotifications (body) {
    const { data } = await api.post('/users/update-notifications', body)
    return data
  },

  /**
   * POST /v1/users/update-profile
   *
   * @param {object} body
   * @param {string} body.first_name
   * @param {string} body.last_name
   * @param {number} body.language_id
   * @param {string} body.email
   */
  async updateProfile (body) {
    const { data } = await api.post('/users/update-profile', body)
    return data
  },

  /**
   * GET /v1/users/email-change-request
   *
   * @param {object} body
   */
  async emailChangeRequest (body) {
    const { data } = await api.get('/users/email-change-request', body)
    return data
  },

  /**
   * DELETE /v1/users/email-change-request
   *
   * @param {object} body
   */
  async emailChangeRequestCancel (body) {
    const { data } = await api.delete('/users/email-change-request', body)
    return data
  },

  /**
   * POST /v1/users/change-password
   *
   * @param {object} body
   * @param {string} body.current_password
   * @param {string} body.new_password
   */
  async changePassword (body) {
    const { data } = await api.post('/users/change-password', body)
    return data
  },

  /**
   * GET /v1/users
   *
   * @param {object} params
   * @param {Array<string>} params.search
   * @param {string} params.order
   * @param {string} params.orderDirection
   * @param {string} params.filter_id
   * @param {Array<string>} params.status
   * @param {Array<string>} params.access
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index (params = {}) {
    const { data } = await api.get('/users', { params })
    return data
  },

  /**
   * PUT /v1/users/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.first_name
   * @param {string} body.last_name
   * @param {string} body.email
   * @param {string} body.access_type
   * @param {Array<number>} body.project_ids
   * @param {Array<number>} body.admin_roles
   */
  async updateUser (id, body) {
    const { data } = await api.put(`/users/${id}`, body)
    return data
  },

  /**
   * POST /v1/users
   *
   * @param {object} body
   * @param {string} body.first_name
   * @param {string} body.last_name
   * @param {string} body.email
   * @param {string} body.access_type
   * @param {Array<number>} body.project_ids
   * @param {Array<number>} body.admin_roles
   */
  async storeUser (body) {
    const { data } = await api.post('/users', body)
    return data
  },

  /**
   * POST /v1/users/{id}/reset-password
   *
   * @param {number} id
   */
  async resetPassword (id) {
    const { data } = await api.post(`/users/${id}/reset-password`)
    return data
  },

  /**
   * PATCH /v1/users/{id}/toggle
   *
   * @param {number} id
   */
  async toggleUser (id) {
    const { data } = await api.patch(`/users/${id}/toggle`)
    return data
  },

  /**
   * POST /v1/users/update-photo
   *
   * @param {FormData} body
   * @param {File|Blob} body.image
   */
  async updatePhoto(body) {
    const { data } = await api.post('/users/update-photo', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  /**
   * POST /v1/users/validate-two-factor
   *
   * @param {object} body
   * @param {string} body.two_factor_code
   * @param {string} body.type
   */
  async validateTwoFactor(body) {
    const { data } = await api.post('/users/validate-two-factor', body)
    return data
  },

  /**
   * GET /v1/users/list
   *
   * @param {object} params
   * @param {number} body.limit
   * @param {number} body.offset
   * @param {string} body.search
   */
  async list(params = {}) {
    const { data } = await api.get('/users/list', { params })
    return data
  },

  /**
   * GET /v1/users/with-projects
   */
  async withProjects(params = {}) {
    const { data } = await api.get('/users/with-projects', { params })
    return data
  },

  /**
   * PATCH /v1/users/:id/change-service
   *
   * @param {object} body
   * @param {string} body.service_id
   */
  async changeService (id, body = {}) {
    const { data } = await api.patch(`/users/${id}/change-service`, body)
    return data
  },

  /**
   * PATCH /v1/users/:id/update-signature-service
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.day_to_debit
   * @param {string} body.debit_in
   * @param {string} body.expires_on
   */
  async updateSignatureService (id, body = {}) {
    const { data } = await api.patch(`/users/${id}/update-signature-service`, body)
    return data
  }
}
