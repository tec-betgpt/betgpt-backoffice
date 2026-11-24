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
  async show(id: number | string) {
    const { data } = await api.get(`/invoices/${id}`)
    return data
  },

  /**
   * GET /v1/invoices/by-hash/:hash
   */
  async byHash(hash: string) {
    const { data } = await api.get(`/invoices/by-hash/${hash}`)
    return data
  },

  /**
   * GET /v1/invoices/next-due
   */
  async nextDue() {
    const { data } = await api.get('/invoices/next-due')
    return data
  },

  /**
   * GET /v1/invoices/:id/pix
   */
  async pix(id: number | string) {
    const { data } = await api.get(`/invoices/${id}/pix`)
    return data
  },

  /**
   * POST /v1/invoices/:id/trust-release
   */
  async trustRelease(id: number | string) {
    const { data } = await api.post(`/invoices/${id}/trust-release`)
    return data
  },

  /**
   * GET /v1/invoices/get-link/:id
   */
  async getLink(id: number | string) {
    const { data } = await api.get(`/invoices/get-link/${id}`)
    return data
  }
}
