import api from './base';
import type { Role } from '@/contracts/role';

interface RoleIndexParams {
  page?: number
  per_page?: number
  filter_id?: string | null
  searchName?: string
  order?: string
  orderDirection?: string
  access_type?: string
}

interface RoleIndexResponse {
  success: boolean
  message: string | null
  data: {
    roles: Role[]
    pagination: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }
}

interface RoleBody {
  title?: string | null
  filter_id?: string | number
  permissions?: number[]
  [key: string]: unknown
}

export default {
  /**
   * GET /v1/roles
   *
   * @param {object} params
   * @param {string} params.filter_id - filtro de workspace (project_X ou group_X)
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params: RoleIndexParams = {}): Promise<RoleIndexResponse> {
    const { data } = await api.get('/roles', { params })
    return data
  },

  /**
   * POST /v1/roles
   *
   * Nota: o backend exige que `filter_id` resolva para um único projeto.
   *
   * @param {object} body
   * @param {string} body.title
   * @param {string|number} body.filter_id - obrigatório; deve resolver para um único projeto
   * @param {Array<number>} body.permissions
   */
  async store(body: RoleBody) {
    const { data } = await api.post('/roles', body)
    return data
  },

  /**
   * GET /v1/roles/{id}
   *
   * @param {number} id
   */
  async show(id: number) {
    const { data } = await api.get(`/roles/${id}`)
    return data
  },

  /**
   * PUT /v1/roles/{id}
   *
   * Nota: o backend exige que `filter_id` resolva para um único projeto.
   *
   * @param {number} id
   * @param {object} body
   * @param {string|number} body.filter_id - obrigatório; deve resolver para um único projeto
   * @param {Array<number>} body.permissions
   */
  async update(id: number, body: RoleBody) {
    const { data } = await api.put(`/roles/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/roles/{id}
   *
   * @param {number} id
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/roles/${id}`)
    return data
  }
}
