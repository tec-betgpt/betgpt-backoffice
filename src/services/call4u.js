import api from "./base.js";

export default {
  /**
   * GET /v1/call4u
   *
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {number} params.campaign_page
   * @param {number} params.campaign_per_page
   * @param {string} params.campaign_order_by
   * @param {string} params.campaign_type_order
   * @param {Array}  params.campaign_search
   */
  async index(params = {}) {
    const { data } = await api.get("/call4u", { params });
    return data;
  },

  /**
   * GET /v1/call4u/campaigns/{campaignId}/calls
   *
   * @param {number} campaignId
   * @param {object} params
   * @param {string} params.filter_id
   * @param {string} params.start_date
   * @param {string} params.end_date
   * @param {number} params.page
   * @param {number} params.per_page
   * @param {string} params.order_by
   * @param {string} params.type_order
   * @param {string} params.status
   * @param {string} params.phone_number
   */
  async calls(campaignId, params = {}) {
    const { data } = await api.get(`/call4u/campaigns/${campaignId}/calls`, {
      params,
    });
    return data;
  },
};
