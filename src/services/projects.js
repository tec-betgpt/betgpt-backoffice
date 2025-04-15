import api from './base.js';

export default {
  async getProjectIntegrations (id) {
    const { data } = await api.get(`/projects/${id}/integrations`)
    return data
  },

  async bulkUpdateProjectIntegrations (id, body) {
    const { data } = await api.post(`/projects/${id}/integrations/bulk-update`, body)
    return data
  },

  async configurationProjects (params = {}) {
    const { data } = await api.get('/user/configurations/projects', { params })
    return data
  },

  async configurationProjectGroups(params = {}) {
    const { data } = await api.get('/user/configurations/project-groups', { params })
    return data
  },

  async removeProjectGroup (id) {
    const { data } = await api.delete(`/user/configurations/project-groups/${id}`)
    return data
  },

  async store (body) {
    const { data } = await api.post('/user/configurations/project-groups', body)
    return data
  },

  async toogleProject (id) {
    const { data } = await api.patch(`/projects/${id}/toggle`)
    return data
  },

  async storeProject (body) {
    const { data } = await api.post('/projects', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data
  },

  async getProjects (params = {}) {
    const { data } = await api.get('/projects', { params })
    return data
  },

  async storeProjectWithId (id, body) {
    const { data } = await api.post(`/projects/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data
  }
}
