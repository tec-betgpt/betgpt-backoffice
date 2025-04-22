import api from './base.js'

export default {
  async index (params = {}) {
    const { data } = await api.get('/sms-funnel', { params })
    return data
  },
}
