import api from './base';
import type { Sector } from '@/contracts/sector';

interface SectorIndexParams {
  filter_id?: string | null
  find_name?: Array<Record<string, string | null>>
  sort_by?: string
  sort_order?: string
  page?: number
  per_page?: number | string
}

interface SectorPaginator {
  current_page: number
  data: Sector[]
  last_page: number
  per_page: number
  total: number
}

interface SectorIndexResponse {
  success: boolean
  message: string | null
  data: SectorPaginator
}

interface SectorResponse {
  success: boolean
  message: string | null
  data: Sector
}

export default {
  /**
   * GET /v1/sectors
   *
   * @param {object|null} params
   * @param {string} params.filter_id
   * @param {string} params.find_name
   * @param {string} params.sort_by
   * @param {string} params.sort_order
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params: SectorIndexParams = {}): Promise<SectorIndexResponse> {
    const { data } = await api.get('/sectors', { params })
    return data
  },

  /**
   * GET /v1/sectors/{id}
   *
   * @param {number} id
   */
  async show(id: number): Promise<SectorResponse> {
    const { data } = await api.get(`/sectors/${id}`)
    return data
  },

  /**
   * POST /v1/sectors
   *
   * @param {object} body
   * @param {string} body.name
   * @param {number} body.project_id
   */
  async store(body: Record<string, unknown>): Promise<SectorResponse> {
    const { data } = await api.post('/sectors', body)
    return data
  },

  /**
   * PUT /v1/sectors/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {number} body.project_id
   * @param {number} body.user_id
   */
  async update(id: number, body: Record<string, unknown>): Promise<SectorResponse> {
    const { data } = await api.put(`/sectors/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/sectors/{id}
   *
   * @param {number} id
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/sectors/${id}`)
    return data
  }
}
