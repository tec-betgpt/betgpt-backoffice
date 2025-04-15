import api from './base.js';

export default {
  async home (params = {}) {
    const { data } = await api.get('/utils/home', { params })
    return data
  },

  async activeCampaign (params = {}) {
    const { data } = await api.get('/utils/active-campaign', { params })
    return data
  },

  async analytics (params = {}) {
    const { data } = await api.get('/utils/analytics', { params })
    return data
  },

  async getGoogleAnalytics (params = {}) {
    const { data } = await api.get('/utils/google-analytics', { params })
    return data
  },

  async getSmsfunnel (params = {}) {
    const { data } = await api.get('/utils/sms-funnel', { params })
    return data
  },

  async getInsights (params = {}) {
    const { data } = await api.get('/utils/insights', { params })
    return data
  },

  async storeInsights (body) {
    const { data } = await api.post('/utils/insights', body)
    return data
  },

  async destroyInsights (id) {
    const { data } = await api.delete(`/utils/insights/${id}`)
    return data
  },

  async updateInsights (id, body) {
    const { data } = await api.put(`/utils/insights/${id}`, body)
    return data
  }
}
