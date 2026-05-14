import api from './base.js';

export default {
  /**
   * GET /v1/meta-ads/pixels
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async getPixels(params = {}) {
    const { data } = await api.get('/meta-ads/pixels', { params });
    return data;
  },

  /**
   * POST /v1/meta-ads/pixels
   *
   * @param {object} params
   * @param {number} params.project_id
   * @param {string} params.name
   */
  async createPixel(params = {}) {
    const { data } = await api.post('/meta-ads/pixels', params);
    return data;
  },

  /**
   * GET /v1/meta-ads/events
   *
   * @param {object} params
   * @param {number} params.project_id
   */
  async getEvents(params = {}) {
    const { data } = await api.get('/meta-ads/metrics', { params });
    return data;
  },
}