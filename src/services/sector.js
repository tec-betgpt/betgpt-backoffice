import api from './base';

export default {
  async index (params = {}) {
    const { data } = await api.get('/sectors', { params })
    return data
  },

  async destroy (id) {
    const { data } = await api.delete(`/sectors/${id}`)
    return data
  },

  async update (id, body) {
    const { data } = await api.put(`/sectors/${id}`, body)
    return data
  },

  async store (body) {
    const { data } = await api.post('/sectors', body)
    return data
  }
}
