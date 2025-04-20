import api from './base';

export default {
  async index (params = {}) {
    const { data } = await api.get('/user-project-groups', { params })
    return data
  },

  async getProjects (params = {}) {
    const { data } = await api.get('/user-project-groups/get-projects', { params })
    return data
  },

  async setProjectWorkspace (body) {
    const { data } = await api.post('/user-project-groups/set-project-workspace', body)
    return data
  },

  async configurationProjects (params = {}) {
    const { data } = await api.get('/user-project-groups/projects', { params })
    return data
  },

  async configurationProjectGroups(params = {}) {
    const { data } = await api.get('/user-project-groups/project-groups', { params })
    return data
  },

  async destroy (id) {
    const { data } = await api.delete(`/user-project-groups/${id}`)
    return data
  },

  async store (body) {
    const { data } = await api.post('/user-project-groups', body)
    return data
  },
}
