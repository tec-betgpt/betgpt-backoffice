import api from './base.js';

export default {
  /**
   * GET /v1/projects
   *
   * @param {object} params
   * @param {number} params.player_id
   * @param {number} params.project_id
   * @param {number} params.active
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params = {}) {
    const { data } = await api.get('/protection-lists', { params })
    return data
  },

  /**
   * @param {object} body
   * @param {number} body.player_id
   * @param {number} body.project_id
   * @param {'LP_ENTERED' | 'LP_EXITED' | 'LP_UPDATED'} body.dispatch_type
   * @param {'forced' | 'exclusion' | 'temp_suspension' } body.event_type
   * @param {string} body.channel
   * @param {string} body.start_at
   * @param {string} body.end_at
   * @param {string} body.reason
   * @returns {Promise<void>}
   */
  async store(body = {}) {
    const { data } = await api.post('/protection-lists', body)
    return data
  },

  /**
   * @param {number }id
   * @returns {Promise<any>}
   */
  async show(id) {
    const { data } = await api.get(`/protection-lists/${id}`)
    return data
  },

  /**
   * @param {number} id
   * @param {object} body
   * @param {number} body.project_id
   * @param {'LP_ENTERED' | 'LP_EXITED' | 'LP_UPDATED'} body.dispatch_type
   * @param {'forced' | 'exclusion' | 'temp_suspension' } body.event_type
   * @param {string} body.channel
   * @param {string} body.start_at
   * @param {string} body.end_at
   * @param {string} body.reason
   * @returns {Promise<void>}
   */
  async update(id, body = {}) {
    const { data } = await api.put(`/protection-lists/${id}`, body)
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async destroy(id) {
    const { data } = await api.delete(`/protection-lists/${id}`)
    return data
  },

  /**
   * @param {object} body
   * @param {number} body.player_id
   * @param {number} body.project_id
   * @param {boolean} body.active
   * @returns {Promise<void>}
   */
  async export(body = {}) {
    const { data } = await api.post('/protection-lists/export', body)
    return data
  },

  /**
   * @param {object} params
   * @param {number} params.project_id
   * @returns {Promise<void>}
   */
  async dashboard(params = {}) {
    const { data } = await api.get('/protection-lists/dashboard', { params })
    return data
  },

  /**
   * @param {object} params
   * @param {number} params.project_id
   * @returns {Promise<void>}
   */
  async alerts(params = {}) {
    const { data } = await api.get('/protection-lists/alerts', { params })
    return data
  }
}


