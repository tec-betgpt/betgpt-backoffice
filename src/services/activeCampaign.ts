import api from "./base.js";
import type { ActiveCampaignIndexResponse } from "@/contracts/activeCampaign";

interface ActiveCampaignIndexParams {
  filter_id?: string | null
  order_by?: string
  type_order?: string
  start_date?: string
  end_date?: string
  /** O backend espera o plural `per_pages` mesmo. */
  per_pages?: number | string
  page?: number
  search?: string[] | Record<string, string>
}

export default {
  /**
   * GET /v1/active-campaign
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.order_by
   * @param {string} params.type_order
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {number} params.per_pages - nome plural é esperado pelo backend
   * @param {number} params.page
   * @param {Array<string>} params.search
   */
  async index(params: ActiveCampaignIndexParams = {}): Promise<{ data: ActiveCampaignIndexResponse }> {
    const { data } = await api.get("/active-campaign", { params });
    return data;
  },

  /**
   * GET /v1/active-campaign/legacy
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.order_by
   * @param {string} params.type_order
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {number} params.per_pages - nome plural é esperado pelo backend
   * @param {number} params.page
   * @param {Array<string>} params.search
   */
  async legacy(params: ActiveCampaignIndexParams = {}): Promise<{ data: ActiveCampaignIndexResponse }> {
    const { data } = await api.get("/active-campaign/legacy", { params });
    return data;
  },

  /**
   * GET /v1/active-campaign/campaign/{id}
   *
   * @param {number|string} project_id - ID do projeto
   * @param {number|string} id - ID da campanha
   */
  async getCampaign(project_id: number | string, id: number | string) {
    const { data } = await api.get(
      `/active-campaign/campaign/${project_id}/${id}`
    );
    return data;
  },
};
