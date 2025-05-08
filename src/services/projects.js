import api from './base.js';

export default {
  /**
   * GET /v1/projects
   *
   * @param {object} params
   * @param {Array<string>} params.search
   * @param {Array<string>} params.status
   * @param {number} params.page
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   */
  async index (params = {}) {
    const { data } = await api.get('/projects', { params })
    return data
  },

  /**
   * POST /v1/projects
   *
   * @param {FormData} body
   * @param {string} body.name
   * @param {File|Blob} body.image
   */
  async store (body) {
    const { data } = await api.post('/projects', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  /**
   * POST /v1/projects/{id}
   *
   * @param {id} id
   * @param {FormData} body
   * @param {string} body.name
   * @param {File|Blob} body.image
   */
  async update (id, body) {
    const { data } = await api.post(`/projects/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  /**
   * GET /v1/projects/{id}/integrations
   * /
   * @param {number} id
   */
  async integrations (id) {
    const { data } = await api.get(`/projects/${id}/integrations`)
    return data
  },

  /**
   * POST /v1/projects/{id}/integrations/bulk-update
   *
   * @param {number} id
   * @param {Array<object>} body
   * @param {number} body.id
   * @param {string} body.config
   */
  async bulkUpdate (id, body) {
    const { data } = await api.post(`/projects/${id}/integrations/bulk-update`, body)
    return data
  },

  /**
   * PATCH /v1/projects/{id}/toggle
   *
   * @param {number} id
   */
  async toggle (id) {
    const { data } = await api.patch(`/projects/${id}/toggle`)
    return data
  }
}
