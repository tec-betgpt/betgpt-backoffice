import api from './base.js';
import type { ProtectionList } from '@/contracts/protectionList';

interface ProtectionListIndexParams {
  player_id?: number
  project_id?: number
  filter_id?: string | null
  active?: number
  page?: number
  per_page?: number
}

interface ProtectionListBody {
  player_id?: number | null
  project_id?: number | null
  /** 'LP_ENTERED' | 'LP_EXITED' | 'LP_UPDATED' */
  dispatch_type?: string
  /** 'forced' | 'exclusion' | 'temp_suspension' */
  event_type?: string
  channel?: string
  start_at?: string
  end_at?: string
  reason?: string | null
  active?: boolean
  [key: string]: unknown
}

interface ProtectionListPlayersPaginator {
  current_page: number
  data: Array<{ id: number; name: string }>
  last_page: number
  per_page: number
  total: number
}

export default {
  /**
   * GET /v1/protection-lists
   *
   * @param {object} params
   * @param {number} params.player_id
   * @param {number} params.project_id
   * @param {string} params.filter_id
   * @param {number} params.active
   * @param {number} params.page
   * @param {number} params.per_page
   */
  async index(params: ProtectionListIndexParams = {}) {
    const { data } = await api.get('/protection-lists', { params })
    return data
  },

  /**
   * @param {object} body
   * @param {number} body.player_id
   * @param {number} body.project_id
   * @param {'LP_ENTERED' | 'LP_EXITED' | 'LP_UPDATED'} body.dispatch_type
   * @param {'forced' | 'exclusion' | 'temp_suspension' } body.event_type
   * @param {string} body.channel
   * @param {string} body.start_at
   * @param {string} body.end_at
   * @param {string} body.reason
   * @returns {Promise<void>}
   */
  async store(body: ProtectionListBody = {}) {
    const { data } = await api.post('/protection-lists', body)
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<ProtectionList>}
   */
  async show(id: number): Promise<ProtectionList> {
    const { data } = await api.get(`/protection-lists/${id}`)
    return data
  },

  /**
   * @param {number} id
   * @param {object} body
   * @param {number} body.project_id
   * @param {'LP_ENTERED' | 'LP_EXITED' | 'LP_UPDATED'} body.dispatch_type
   * @param {'forced' | 'exclusion' | 'temp_suspension' } body.event_type
   * @param {string} body.channel
   * @param {string} body.start_at
   * @param {string} body.end_at
   * @param {string} body.reason
   * @returns {Promise<void>}
   */
  async update(id: number, body: ProtectionListBody = {}) {
    const { data } = await api.put(`/protection-lists/${id}`, body)
    return data
  },

  /**
   * @param {number} id
   * @returns {Promise<void>}
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/protection-lists/${id}`)
    return data
  },

  /**
   * @param {object} body
   * @param {number} body.player_id
   * @param {number} body.project_id
   * @param {boolean} body.active
   * @returns {Promise<void>}
   */
  async export(body: ProtectionListBody = {}) {
    const { data } = await api.post('/protection-lists/export', body)
    return data
  },

  /**
   * @param {object} params
   * @param {number} params.project_id
   * @param {string} params.filter_id - aceito pelo backend (preferido sobre project_id)
   * @returns {Promise<void>}
   */
  async dashboard(params: { project_id?: number | string; filter_id?: string | null } = {}) {
    const { data } = await api.get('/protection-lists/dashboard', { params })
    return data
  },

  /**
   * @param {object} params
   * @param {number} params.project_id
   * @param {string} params.filter_id - aceito pelo backend (preferido sobre project_id)
   * @returns {Promise<void>}
   */
  async alerts(params: { project_id?: number | string; filter_id?: string | null } = {}) {
    const { data } = await api.get('/protection-lists/alerts', { params })
    return data
  },

  /**
   * @param {number|string} projectId
   * @param {object} params
   * @param {string} params.filter_id
   * @returns {Promise<ProtectionListPlayersPaginator>}
   */
  async getPlayersByProject(
    projectId: number | string,
    params: { search?: string; per_page?: number; page?: number; filter_id?: string | null } = {}
  ): Promise<ProtectionListPlayersPaginator> {
    const { data } = await api.get(`/protection-lists/projects/${projectId}/players`, { params })
    return data
  }
}
