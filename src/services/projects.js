import api from './base.js';

export default {
  async integrations (id) {
    const { data } = await api.get(`/projects/${id}/integrations`)
    return data
  },

  async bulkUpdate (id, body) {
    const { data } = await api.post(`/projects/${id}/integrations/bulk-update`, body)
    return data
  },

  async toggle (id) {
    const { data } = await api.patch(`/projects/${id}/toggle`)
    return data
  },

  async store (body) {
    const { data } = await api.post('/projects', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async index (params = {}) {
    const { data } = await api.get('/projects', { params })
    return data
  },

  async storeWithId (id, body) {
    const { data } = await api.post(`/projects/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  }
}
