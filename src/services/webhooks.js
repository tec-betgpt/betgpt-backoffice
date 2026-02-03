import api from "./base";

export default {




  async index(id) {
    const res = await api.get(`/projects/${id}/webhooks`);
    return res.data;
  },


  async update(id, data) {
    const res = await api.post(`/projects/${id}/webhooks`, data);
  },
  /**
   * LOGS
   *
   */
  /**
   * Listar Logs
   * @param {Object} params - { filter_id, status, order, page }
   */
  async indexLogs(params) {
    return api.get("/webhook-logs", { params }).then((res) => res.data);
  },

  /**
   * Reprocessar Webhook
   * @param {number} id
   */
  async retry(id) {
    return api.post(`/webhook-logs/${id}/retry`).then((res) => res.data);
  },
};
