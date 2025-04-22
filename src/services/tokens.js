import api from './base.js'

export default {
  async check (body) {
    const { data } = await api.post('/token/check', body)
    return data
  },

  async send (body) {
    const { data } = await api.post('/token/send', body)
    return data
  }
}
