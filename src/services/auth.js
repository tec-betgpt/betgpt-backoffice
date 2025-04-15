import api from './base.js';

export default {
  async user () {
    const { data } = await api.get('/auth/user', { withCredentials: true })
    return data
  },

  async login (body) {
    const { data } = await api.post('/auth/login', body, { withCredentials: true })
    return data
  },

  async twoFactor (body) {
    const { data } = await api.post('/auth/login/two-factor', body, { withCredentials: true })
    return data
  },

  async getTwoFactor (id) {
    const { data } = await api.get(`/auth/login/two-factor/${id}`)
    return data
  },

  async getValidateRecoveryCode (id) {
    const { data } = await api.get(`/auth/validate-recovery-code/${id}`)
    return data
  },

  async validateRecoveryCode (body) {
    const { data } = await api.post('/auth/validate-recovery-code', body, { withCredentials: true })
    return data
  },

  async logout () {
    await api.post('/auth/logout', {}, { withCredentials: true })
  },

  async getLoginTwoFactor (id) {
    const { data } = await api.get(`/auth/login/two-factor/${id}`)
    return data
  }
}
