import api from './base';

export default {
  async index (params = {}) {
    const { data } = await api.get('/roles', { params })
    return data
  },

  async store (body) {
    const { data } = await api.post('/roles', body)
    return data
  },

  async update (id, body) {
    const { data } = await api.put(`/roles/${id}`, body)
    return data
  }
}
