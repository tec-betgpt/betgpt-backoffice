import api from './base.js';
import type { UtmTracksIndexResponse } from '@/contracts/utmTrack';

interface UtmTrackIndexParams {
  page?: number
  perPage?: number
  orderBy?: string
  orderDirection?: string
  search?: string[] | Record<string, string>
  filter_id?: string | null
  type?: string[]
}

interface UtmTrackShowParams {
  id?: number | string
  filter_id?: string | null
}

export default {
  /**
   * GET /v1/utm-tracks
   *
   * @param {object} params
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {Array<string>} params.search
   * @param {string} params.filter_id
   * @param {Array<string>} params.type
   */
  async index(params: UtmTrackIndexParams = {}): Promise<{ data: UtmTracksIndexResponse }> {
   const { data } = await api.get('/utm-tracks', { params })
   return data
  },

  /**
   * GET /v1/utm-tracks/details
   *
   * @param {object} params
   * @param {number|string} params.id
   * @param {string} params.filter_id
   * @returns {Promise<any>}
   */
  async show(params: UtmTrackShowParams = {}): Promise<{ data: any }> {
    const { data } = await api.get('/utm-tracks/details', { params: params })
    return data
  }
}
