import api from './base.js'
import type { ConversionDefinitionListItem, ConversionDefinitionShow } from '@/contracts/conversionDefinition'

interface ConversionDefinitionIndexParams {
  filter_id?: string | null
  is_primary?: boolean
  search?: string[] | Record<string, string>
  page?: number
  per_page?: number
  orderBy?: string
  orderDirection?: string
}

interface ConversionDefinitionPaginator {
  data: ConversionDefinitionListItem[]
  current_page: number
  last_page: number
  total: number
}

/**
 * GET /v1/conversion-definitions — sem `page` (ou page=0) o backend devolve
 * uma lista simples; com `page` devolve { data, current_page, last_page, total }.
 */
type ConversionDefinitionIndexData<T> = T extends { page: number }
  ? ConversionDefinitionPaginator
  : ConversionDefinitionListItem[];

export default {
  /**
   * GET /v1/conversion-definitions
   *
   * @param {object} params
   * @param {string} params.filter_id
   */
  async index<T extends ConversionDefinitionIndexParams = ConversionDefinitionIndexParams>(
    params = {} as T
  ): Promise<{ data: ConversionDefinitionIndexData<T> }> {
    const { data } = await api.get('/conversion-definitions', { params })
    return data
  },

  /**
   * POST /v1/conversion-definitions
   *
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.description
   * @param {boolean} body.is_primary
   * @param {boolean} body.is_return_report
   * @param {string} body.metric_source_type
   * @param {string} body.conversion_category
   * @param {string} body.project_id
   * @param {string} body.conversion_value_field
   * @param {Array<object>} body.conditions
   */
  async store(body: Record<string, unknown>) {
    const { data } = await api.post('/conversion-definitions', body)
    return data
  },

  /**
   * GET /v1/conversion-definitions/{id}
   *
   * @param {number} id
   */
  async show(id: number): Promise<ConversionDefinitionShow> {
    const { data } = await api.get(`/conversion-definitions/${id}`)
    return data
  },

  /**
   * PUT /v1/conversion-definitions/{id}
   *
   * @param {number} id
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.description
   * @param {boolean} body.is_primary
   * @param {boolean} body.is_return_report
   * @param {string} body.project_id
   * @param {string} body.conversion_value_field
   * @param {string} body.channel_group
   * @param {Array<object>} body.conditions
   */
  async update(id: number, body: Record<string, unknown>) {
    const { data } = await api.put(`/conversion-definitions/${id}`, body)
    return data
  },

  /**
   * DELETE /v1/conversion-definitions/{id}
   *
   * @param {number} id
   */
  async destroy(id: number) {
    const { data } = await api.delete(`/conversion-definitions/${id}`)
    return data
  },

  /**
   *
   * @param {object} params
   * @param {string|number} params.filter_id
   *
   */
  async segments(params: { filter_id?: string | number | null } = {}) {
      const { data } = await api.get('/conversion-definitions/segments', {params})
      return data
  },

  /**
   * @returns {Promise<any>}
   */
  async values() {
    const { data } = await api.get('/conversion-definitions/values')
    return data
  },

  /**
   *
   * @param {object} params
   * @param {string} params.project_id
   */
  async channelGroups(params: { project_id?: string | number | null } = {}) {
    const { data } = await api.get('/conversion-definitions/channel-groups', { params })
    return data
  }
}
