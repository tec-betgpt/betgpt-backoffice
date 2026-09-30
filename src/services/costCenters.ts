import api from './base.js'
import type { CostCenter } from '@/contracts/costCenter'

interface CostCenterIndexParams {
  filter_id?: string | number | null
  sort_by?: string | null
  sort_order?: string | null
  find_name?: string | Array<Record<string, string | null>> | null
  page?: number
  per_page?: number | string | null
}

interface CostCenterPaginator {
  current_page: number
  data: CostCenter[]
  last_page: number
  per_page: number
  total: number
}

interface CostCenterIndexResponse {
  success: boolean
  message: string | null
  data: CostCenterPaginator
}

interface CostCenterResponse {
  success: boolean
  message: string | null
  data: CostCenter
}

export default {
  /**
   * GET /v1/cost-centers
   *
   * @param {Partial<object>} params
   * @param {string|number|null} params.filter_id
   * @param {string|null} params.sort_by
   * @param {string|null} params.sort_order
   * @param {string|null} params.find_name
   * @param {number|null} params.per_page
   */
  async index(params: CostCenterIndexParams = {}): Promise<CostCenterIndexResponse> {
    const { data } = await api.get('/cost-centers', { params })
    return data
  },

  /**
   * GET /v1/cost-centers/{id}
   *
   * @param {number} id
   */
  async show(id: number): Promise<CostCenterResponse> {
    const { data } = await api.get(`/cost-centers/${id}`)
    return data
  },

  /**
   * POST /v1/cost-centers
   *
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.otherName
   * @param {number} body.project_id
   * @param {number|null} [body.sector_id]
   */
  async store(body: Record<string, unknown>): Promise<CostCenterResponse> {
    const { data } = await api.post('/cost-centers', body)
    return data
  },

  /**
   * DELETE /v1/cost-centers/{id}
   *
   * @param {number} id
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/cost-centers/${id}`)
    return data
  },

  /**
   * PUT /v1/cost-centers/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {number|null} [body.sector_id]
   * @param {string} body.otherName
   * @param {number} body.user_id
   */
  async update(id: number, body: Record<string, unknown>): Promise<CostCenterResponse> {
    const { data } = await api.put(`/cost-centers/${id}`, body)
    return data
  },
}
