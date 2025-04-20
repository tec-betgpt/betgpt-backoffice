import api from './base.js';

export default {
  /**
   * @deprecated
   */
  async costCenters (params = {}) {
    const { data } = await api.get('/financial/cost-centers', { params })
    return data
  },

  /**
   * @deprecated
   */
  async getCostCenter (id) {
    const { data } = await api.get(`/financial/cost-centers/${id}`)
    return data
  },

  /**
   * @deprecated
   */
  async storeCostCenter (body) {
    const { data } = await api.post('/financial/cost-centers', body)
    return data
  },

  async destroyFinancialTransactions (id) {
    const { data } = await api.delete(`/financial/financial-transactions/${id}`)
    return data
  },

  async updateFinancialTransactions (id, body) {
    const { data } = await api.put(`/financial/financial-transactions/${id}`, body)
    return data
  },

  /**
   * @deprecated
   */
  async getFinancialCostCenters (params = {}) {
    const { data } = await api.get('/financial/cost-centers', { params })
    return data
  },

  async getFinancialTransactions (params = {}) {
    const { data } = await api.get('/financial/financial-transactions', { params })
    return data
  },

  async storeFinancialTransactions (body) {
    const { data } = await api.post('/financial/financial-transactions', body)
    return data
  },

  /**
   * @deprecated
   */
  async destroyCostCenter (id) {
    const { data } = await api.delete(`/financial/cost-centers/${id}`)
    return data
  },

  /**
   * @deprecated
   */
  async updateCostCenter (id, body) {
    const { data } = await api.put(`/financial/cost-centers/${id}`, body)
    return data
  },

  /**
   * @deprecated
   */
  async getSectors (params = {}) {
    const { data } = await api.get('/financial/sectors', { params })
    return data
  },

  /**
   * @deprecated
   */
  async destroyFinancialSectors (id) {
    const { data } = await api.delete(`/financial/sectors/${id}`)
    return data
  },

  /**
   * @deprecated
   */
  async updateFinancialSectors (id, body) {
    const { data } = await api.put(`/financial/sectors/${id}`, body)
    return data
  },

  /**
   * @deprecated
   */
  async storeFinancialSectors (body) {
    const { data } = await api.post('/financial/sectors', body)
    return data
  }
}
