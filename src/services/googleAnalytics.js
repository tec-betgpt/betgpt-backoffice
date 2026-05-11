import api from './base.js';

export default {
  /**
   * GET /v1/google-analytics
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   */
  async index (params = {}) {
    const { data } = await api.get('/google-analytics', { params })
    return data
  },

  /**
   * GET /v1/google-analytics/measurement
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async getMeasurements (params = {}) {
    const { data } = await api.get('/google-analytics/measurement', { params })
    return data
  },

  /**
   * GET /v1/google-analytics/events
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async getEvents (params = {}) {
    const { data } = await api.get('/google-analytics/events', { params })
    return data
  },

  /**
   * POST /v1/google-analytics/events
   *
   * @param {object} params
   * @param {number} params.project_id
   * @param {string} params.event_name
   */
  async createEvent (params = {}) {
    const { data } = await api.post('/google-analytics/events', params)
    return data
  },

  /**
   * GET /v1/google-analytics/measurement-secret
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async getMeasurementSecrets (params = {}) {
    const { data } = await api.get('/google-analytics/measurement-secret', { params })
    return data
  },

  /**
   * POST /v1/google-analytics/measurement-secret
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async createMeasurementSecret (params = {}) {
    const { data } = await api.post('/google-analytics/measurement-secret', params)
    return data
  },
}
