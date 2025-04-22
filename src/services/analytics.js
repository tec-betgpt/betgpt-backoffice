import api from './base.js'

export default {
  async index (params = {}) {
    const { data } = await api.get('/analytics', { params })
    return data
  },
}
