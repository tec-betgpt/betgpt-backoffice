import api from './base';

export default {
  /**
   * GET /v1/invoices
   */
  async index(params = {}) {
    const { data } = await api.get('/invoices', { params })
    return data
  },

  /**
   * GET /v1/invoices/:id
   */
  async show(id) {
    const { data } = await api.get(`/invoices/${id}`)
    return data
  },

  /**
   * GET /v1/invoices/by-hash/:hash
   */
  async byHash(hash) {
    const { data } = await api.get(`/invoices/by-hash/${hash}`)
    return data
  },

  /**
   * GET /v1/invoices/get-link/:id
   */
  async getLink(id) {
    const { data } = await api.get(`/invoices/get-link/${id}`)
    return data
  }
}
