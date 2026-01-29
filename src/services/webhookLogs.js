import api from "./base";

export default {
  /**
   * Listar Logs
   * @param {Object} params - { filter_id, status, order, page }
   */
  index(params) {
    return api.get("/webhook-logs", { params }).then((res) => res.data);
  },

  /**
   * Reprocessar Webhook
   * @param {number} id
   */
  retry(id) {
    return api.post(`/webhook-logs/${id}/retry`).then((res) => res.data);
  },
};
