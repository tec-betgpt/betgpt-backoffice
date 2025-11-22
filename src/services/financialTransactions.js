import api from './base.js'

export default {
  /**
   * GET /v1/financial-transactions
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.sort_column
   * @param {string} params.sort_order
   * @param {string} params.name
   * @param {string} params.per_page
   */
  async index (params = {}) {
    const { data } = await api.get('/financial-transactions', { params })
    return data
  },

  /**
   * POST /v1/financial-transactions
   *
   * @param {object} body
   * @param {number|null} body.cost_center_id
   * @param {string} body.type
   * @param {string} body.category_type
   * @param {number|null} body.percentage
   * @param {number|null} body.amount
   * @param {string} body.description
   * @param {string|null} body.project_id
   * @param {string} body.date
   */
  async store (body) {
    const { data } = await api.post('/financial-transactions', body)
    return data
  },

  /**
   * GET /v1/financial-transactions/{id}
   *
   * @param {number} id
   */
  async show (id) {
    const { data } = await api.get(`/financial-transactions/${id}`)
    return data
  },

  /**
   * PUT /v1/financial-transactions/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.type
   * @param {string} body.category_type
   * @param {number} body.percentage
   * @param {number} body.amount
   * @param {string} body.date
   * @param {string} body.description
   */
  async update (id, body) {
    const { data } = await api.put(`/financial-transactions/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/financial-transactions/{id}
   *
   * @param {number} id
   */
  async destroy (id) {
    const { data } = await api.delete(`/financial-transactions/${id}`)
    return data
  },
}
