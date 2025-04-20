import api from './base.js'

export default {
  async index (params = {}) {
    const { data } = await api.get('/cost-centers', { params })
    return data
  },

  async show (id) {
    const { data } = await api.get(`/cost-centers/${id}`)
    return data
  },

  async store (body) {
    const { data } = await api.post('/cost-centers', body)
    return data
  },

  async destroy (id) {
    const { data } = await api.delete(`/cost-centers/${id}`)
    return data
  },

  async update (id, body) {
    const { data } = await api.put(`/cost-centers/${id}`, body)
    return data
  },
}
