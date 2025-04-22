import api from './base.js'

export default {
  async index (params = {}) {
    const { data } = await api.get('/financial-transactions', { params })
    return data
  },

  async store (body) {
    const { data } = await api.post('/financial-transactions', body)
    return data
  },

  async update (id, body) {
    const { data } = await api.put(`/financial-transactions/${id}`, body)
    return data
  },

  async destroy (id) {
    const { data } = await api.delete(`/financial-transactions/${id}`)
    return data
  },
}
