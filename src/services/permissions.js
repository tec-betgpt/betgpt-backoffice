import api from './base.js';

export default {
  async index (params = {}) {
    const { data } = await api.get('/permissions', { params })
    return data
  }
}
