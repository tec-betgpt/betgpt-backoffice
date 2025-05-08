import api from './base';

export default {
  /**
   * GET /v1/user-project-groups
   *
   * @param {object} params
   */
  async index (params = {}) {
    const { data } = await api.get('/user-project-groups', { params })
    return data
  },

  /**
   * POST /v1/user-project-groups/set-project-workspace
   *
   * @param {object} body
   * @param {object} body.group_project
   */
  async setProjectWorkspace (body) {
    const { data } = await api.post('/user-project-groups/set-project-workspace', body)
    return data
  },

  /**
   * DELETE /v1/user-project-groups/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/user-project-groups/${id}`)
    return data
  },

  /**
   * POST /v1/user-project-groups
   *
   * @param {object} body
   * @param {string} body.name
   * @param {Array<number>} body.project_ids
   */
  async store (body) {
    const { data } = await api.post('/user-project-groups', body)
    return data
  },
}
