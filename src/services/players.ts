import api from "./base.js";
import type { PlayerDetails, PlayerListResponse } from "@/contracts/player";

interface PlayerIndexParams {
  page?: number
  perPage?: number
  search?: string[]
  tag_name?: string
  orderBy?: string
  orderDirection?: string
  filter_id?: string | null
}

interface PlayerShowParams {
  filter_id?: string | null
  include?: string
  type?: string
  page?: number
}

interface PlayerHistoryPaginator {
  current_page: number
  data: unknown[]
  last_page: number
  per_page: number
  total: number
}

export default {
  /**
   * GET /v1/players
   *
   * Nota: o backend usa `simplePaginate` — a resposta não tem `total`/`last_page`.
   *
   * @param {object|any} params
   * @param {number} params.page
   * @param {number} params.perPage
   * @param {Array<string>} params.search
   * @param {string} params.tag_name
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {string} params.filter_id
   */
  async index(params: PlayerIndexParams = {}): Promise<PlayerListResponse> {
    const { data } = await api.get("/players", { params })
    return data
  },

  /**
   * @param {number|string} id
   * @param {object|any} params
   * @param {string} params.filter_id
   * @param {string} params.include - 'history' inclui o paginador `history` na resposta
   */
  async show<T extends PlayerShowParams = PlayerShowParams>(
    id: number | string,
    params = {} as T
  ): Promise<T extends { include: string } ? PlayerDetails & { history: PlayerHistoryPaginator } : PlayerDetails> {
    const { data } = await api.get(`/players/${id}`, { params })
    return data
  },

  async smartico(id: number | string, params: { filter_id?: string | number | null } = {}) {
    const { data } = await api.get(`/players/${id}/smartico`, { params })
    return data
  },

  /**
   * @param {number|string} id
   * @param {object} body
   * @param {string} body.name
   * @param {string} body.email
   * @param {object} params
   * @param {string} params.filter_id
   */
  async update(id: number | string, body: Record<string, unknown> = {}, params: { filter_id?: string | null } = {}) {
    const { data } = await api.put(`/players/${id}`, body, { params })
    return data
  },

  /**
   * @param {number|string} id
   */
  async destroy(id: number | string) {
    const { data } = await api.delete(`/players/${id}`)
    return data
  }
}
