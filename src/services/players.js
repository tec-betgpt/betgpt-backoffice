import api from "./base.js";

export default {
  /**
   * GET /v1/players
   *
   * @param {object|any} params
   * @param {number} params.size
   * @param {number} params.page
   * @param {number} params.perPage
   * @param {Array<string>} params.search
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {string} params.filter_id
   */
  async index (params = {}) {
    const { data } = await api.get("/players", { params })
    return data
  },

  /**
   * @param {number} id
   * @param {object|any} params
   * @param {any} params.filter_id
   * @param {string} params.include
   */
  async show (id, params = {}) {
    const { data } = await api.get(`/players/${id}`, { params })
    return data
  },

  /**
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.email
   * @param {object} params
   * @param {any} params.filter_id
   */
  async update(id, body = {}, params = {}) {
    const { data } = await api.put(`/players/${id}`, body, { params })
    return data
  },

  /**
   * @param {number} id
   */
  async destroy(id) {
    const { data } = await api.delete(`/players/${id}`)
    return data
  }
}
