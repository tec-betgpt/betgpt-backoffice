import api from "./base.js";

export default {
  /**
   * GET /v1/postback-logs
   *
   * @param {object} params
   * @param {string} params.filter_id - ID do filtro (obrigatório)
   * @param {string} params.type - Tipo de postback (obrigatório)
   * @param {string} params.status - Status do postback (obrigatório)
   * @param {string} params.start_date - Data inicial (opcional)
   * @param {string} params.end_date - Data final (opcional)
   * @param {number} params.page - Página atual (opcional)
   * @param {number} params.per_page - Itens por página (opcional)
   * @param {string} params.orderBy - Tipo de ordem da tabela (opcional)
   * @param {string} params.orderDirection
   */
  async index(params = {}) {
    if (!params.filter_id || !params.type) {
      throw new Error("filter_id and type are required");
    }

    const { data } = await api.get("/postback-logs", { params });
    return data;
  },

  /**
   * GET /v1/postback-logs/{id}/payload
   *
   * @param {number} id - ID do log de postback
   */
  async payload(id) {
    const { data } = await api.get(`/postback-logs/${id}/payload`);
    return data;
  },

  /**
   * Tipos de postback disponíveis
   */
  get types() {
    return {
      PLAYER: "1",
      DEPOSIT: "2",
      WITHDRAW: "3",
      LOGIN: "5",
      STATUS_CHANGE: "6",
    };
  },
};
