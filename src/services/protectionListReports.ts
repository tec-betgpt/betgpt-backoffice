import api from './base.js';
import type { ProtectionListReport } from '@/contracts/protectionListReport';

interface ReportIndexParams {
  project_id?: number | string
  filter_id?: string | null
  status?: string
  page?: number
  per_page?: number
}

interface ProtectionListReportPaginator {
  current_page: number
  data: ProtectionListReport[]
  last_page: number
  per_page: number
  total: number
}

export default {
  /**
   * GET /v1/protection-list-reports
   *
   * @param {object} params
   * @param {number} params.project_id
   * @param {string} params.filter_id
   * @param {string} params.status
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params: ReportIndexParams = {}): Promise<ProtectionListReportPaginator> {
    const { data } = await api.get('/protection-list-reports', { params })
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<ProtectionListReport>}
   */
  async show(id: number): Promise<ProtectionListReport> {
    const { data } = await api.get(`/protection-list-reports/${id}`)
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/protection-list-reports/${id}`)
    return data
  }
}
