import api from './base.js'

export default {
  async index (params = {}) {
    const { data } = await api.get('/insights', { params })
    return data
  },

  async store (body) {
    const { data } = await api.post('/insights', body)
    return data
  },

  async destroy (id) {
    const { data } = await api.delete(`/insights/${id}`)
    return data
  },

  async update (id, body) {
    const { data } = await api.put(`/insights/${id}`, body)
    return data
  }
}
