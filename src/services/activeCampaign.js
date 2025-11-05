import api from "./base.js";

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
   * @param {number} params.per_pages
   * @param {number} params.page
   * @param {Array<string>} params.search
   * @param {string} params.last_send_date
   */
  async index(params = {}) {
    const { data } = await api.get("/active-campaign", { params });
    return data;
  },

  /**
   * GET /v1/active-campaign/campaign/{id}
   *
   * @param {number} project_id - ID do projeto
   * @param {string} id - ID da campanha
   */
  async getCampaign(project_id, id) {
    const { data } = await api.get(
      `/active-campaign/campaign/${project_id}/${id}`
    );
    return data;
  },
};
