import api from './base.js'

export default {
  async disableTwoFactor (body) {
    const { data } = await api.post('/user/configurations/disable-two-factor', body)
    return data
  },

  async activeTwoFactor (body) {
    const { data } = await api.post('/user/configurations/active-two-factor', body)
    return data
  },

  async confirmEmailChange (token, body) {
    const { data } = await api.post(`/user/configurations/confirm-email-change/${token}`, body)
    return data
  },

  async updateNotifications (body) {
    const { data } = await api.post('/user/configurations/update-notifications', body)
    return data
  },

  async updateProfile (body) {
    const { data } = await api.post('/user/configurations/update-profile', body)
    return data
  },

  async emailChangeRequest (body) {
    const { data } = await api.get('/user/configurations/email-change-request', body)
    return data
  },

  async emailChangeRequestCancel (body) {
    const { data } = await api.delete('/user/configurations/email-change-request', body)
    return data
  },

  async changePassword (body) {
    const { data } = await api.post('/user/configurations/change-password', body)
    return data
  },

  async getUsers (params = {}) {
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
    const { data } = await api.post(`/user/${id}/reset-password`)
    return data
  },

  async toggleUser (id) {
    const { data } = await api.patch(`/users/${id}/toggle`)
    return data
  },

  async updatePhoto(body) {
    const { data } = await api.post('/user/configurations/update-photo', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data
  },

  async validateTwoFactor(body) {
    const { data } = await api.post('/user/configurations/validate-two-factor', body)
    return data
  }
}
