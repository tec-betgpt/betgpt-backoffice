import api from './base.js';

export default {
  async costCenters (params = {}) {
    const { data } = await api.get('/financial/cost-centers', { params })
    return data
  },

  async getCostCenter (id) {
    const { data } = await api.get(`/financial/cost-centers/${id}`)
    return data
  },

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

  async destroyCostCenter (id) {
    const { data } = await api.delete(`/financial/cost-centers/${id}`)
    return data
  },

  async updateCostCenter (id, body) {
    const { data } = await api.put(`/financial/cost-centers/${id}`, body)
    return data
  },

  async getSectors (params = {}) {
    const { data } = await api.get('/financial/sectors', { params })
    return data
  },

  async destroyFinancialSectors (id) {
    const { data } = await api.delete(`/financial/sectors/${id}`)
    return data
  },

  async updateFinancialSectors (id, body) {
    const { data } = await api.put(`/financial/sectors/${id}`, body)
    return data
  },

  async storeFinancialSectors (body) {
    const { data } = await api.post('/financial/sectors', body)
    return data
  }
}
