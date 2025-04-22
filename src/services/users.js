import api from './base.js'

export default {
  async disableTwoFactor (body) {
    const { data } = await api.post('/users/disable-two-factor', body)
    return data
  },

  async activeTwoFactor (body) {
    const { data } = await api.post('/users/active-two-factor', body)
    return data
  },

  async confirmEmailChange (token, body) {
    const { data } = await api.post(`/users/confirm-email-change/${token}`, body)
    return data
  },

  async updateNotifications (body) {
    const { data } = await api.post('/users/update-notifications', body)
    return data
  },

  async updateProfile (body) {
    const { data } = await api.post('/users/update-profile', body)
    return data
  },

  async emailChangeRequest (body) {
    const { data } = await api.get('/users/email-change-request', body)
    return data
  },

  async emailChangeRequestCancel (body) {
    const { data } = await api.delete('/users/email-change-request', body)
    return data
  },

  async changePassword (body) {
    const { data } = await api.post('/users/change-password', body)
    return data
  },

  async index (params = {}) {
    const { data } = await api.get('/users', { params })
    return data
  },

  async updateUser (id, body) {
    const { data } = await api.put(`/users/${id}`, body)
    return data
  },

  async storeUser (body) {
    const { data } = await api.post('/users', body)
    return data
  },

  async resetPassword (id) {
    const { data } = await api.post(`/users/${id}/reset-password`)
    return data
  },

  async toggleUser (id) {
    const { data } = await api.patch(`/users/${id}/toggle`)
    return data
  },

  async updatePhoto(body) {
    const { data } = await api.post('/users/update-photo', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async validateTwoFactor(body) {
    const { data } = await api.post('/users/validate-two-factor', body)
    return data
  }
}
