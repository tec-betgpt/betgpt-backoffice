import api from './base.js';
import type { Project, ProjectListItem } from '@/contracts/project';

interface ProjectIndexParams {
  search?: string[];
  status?: string[];
  page?: number;
  orderBy?: string;
  orderDirection?: string;
  per_page?: number;
}

interface ProjectsPaginator {
  current_page: number;
  data: ProjectListItem[];
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * GET /v1/projects — sem `page` (ou page=0) o backend devolve uma lista
 * simples; com `page` devolve um paginador Laravel.
 */
type ProjectIndexData<T> = T extends { page: number } ? ProjectsPaginator : ProjectListItem[];

interface OAuthParams {
  integration_id?: string;
  project_id?: string | number;
}

export default {
  /**
   * GET /v1/projects
   *
   * @param {object} params
   * @param {Array<string>} params.search
   * @param {Array<string>} params.status
   * @param {number} params.page
   * @param {string} params.orderBy
   * @param {string} params.orderDirection
   * @param {number} params.per_page
   */
  async index<T extends ProjectIndexParams = ProjectIndexParams>(
    params = {} as T
  ): Promise<{ data: ProjectIndexData<T> }> {
    const { data } = await api.get('/projects', { params })
    return data
  },

  /**
   * POST /v1/projects
   *
   * @param {FormData|object} body
   * @param {string} body.name
   * @param {File|Blob} body.image
   */
  async store(body: FormData | Record<string, unknown>): Promise<{ data: Project }> {
    const { data } = await api.post('/projects', body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  /**
   * POST /v1/projects/{id}
   *
   * @param {number|string} id
   * @param {FormData|object} body
   * @param {string} body.name
   * @param {File|Blob} body.image
   * @param {string} body.webhook_url
   */
  async update(id: number | string, body: FormData | Record<string, unknown>): Promise<{ data: Project }> {
    const { data } = await api.post(`/projects/${id}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  /**
   * GET /v1/projects/{id}/integrations
   *
   * @param {number|string} id
   */
  async integrations(id: number | string) {
    const { data } = await api.get(`/projects/${id}/integrations`)
    return data
  },

  /**
   * POST /v1/projects/{id}/integrations/bulk-update
   *
   * @param {number|string} id
   * @param {Array<object>} body
   */
  async bulkUpdate(id: number | string, body: Array<Record<string, unknown>>) {
    const { data } = await api.post(`/projects/${id}/integrations/bulk-update`, body)
    return data
  },

  /**
   * PATCH /v1/projects/{id}/toggle
   *
   * @param {number|string} id
   */
  async toggle(id: number | string): Promise<{ project: Project }> {
    const { data } = await api.patch(`/projects/${id}/toggle`)
    return data
  },

  /**
   * GET /v1/projects/propertier
   * @param {object} params
   * @param {string} params.integration_id
   * @param {string} params.project_id
   */
  async property(params: OAuthParams = {}) {
    const { data } = await api.get(`/projects/integrations/oauth/property`, { params: params })
    return data.data
  },

  /**
   * GET /v1/projects/integrations/oauth/postmaster/domains
   * @param {object} params
   * @param {string} params.integration_id
   * @param {string} params.project_id
   */
  async postmasterDomains(params: OAuthParams = {}) {
    const { data } = await api.get(`/projects/integrations/oauth/postmaster/domains`, { params: params })
    return data.data
  },

  /**
   * GET /v1/projects/integrations/adaccount
   * @param {object} params
   * @param {string} params.integration_id
   * @param {string} params.project_id
   */
  async adAccount(params: OAuthParams = {}) {
    const { data } = await api.get(`/projects/integrations/oauth/adaccount`, { params: params })
    return data.data
  },

  /**
   * GET /v1/projects/integrations/oauth/logout
   *
   * @param {object} params
   * @param {string} params.integration_id
   * @param {string} params.project_id
   */
  async logoutOAuth(params: OAuthParams = {}) {
    const { data } = await api.get(`/projects/integrations/oauth/logout`, { params: params })
    return data
  },

  /**
   * GET /v1/projects/status
   *
   * @param {object} params
   * @param {string} params.project_id
   */
  async statusOAuth(params: OAuthParams = {}) {
    const { data } = await api.get(`/projects/integrations/status`, { params: params })
    return data
  }
}
