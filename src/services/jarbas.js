import api from "./base.js";

export default {
  /**
   * GET /jarbas-config
   *
   * @param {string|number} filterId - ID do projeto para filtrar as configurações
   * @returns {Promise<object>} Objeto contendo:
   *   - config: configurações atuais do bot
   *   - feedbackHistory: histórico de feedbacks
   *   - hasPendingFeedback: indica se há feedback pendente
   */
  async getConfig(filterId) {
    const { data } = await api.get(`/jarbas-config?filter_id=${filterId}`);
    return data;
  },

  /**
   * POST /jarbas-config
   *
   * @param {string|number} filterId - ID do projeto para atualização
   * @param {object} body - Configurações a serem atualizadas
   * @param {string} body.whatsapp_number - Número de WhatsApp vinculado ao bot
   * @param {boolean} body.bot_active - Status de ativação do bot
   * @param {string} [body.user_name] - Como o bot deve chamar o usuário
   * @param {string} [body.user_role] - Descrição da função do usuário
   * @param {object} body.bot_traits - Características do bot
   * @param {boolean} body.bot_traits.kind - Se o bot é simpático
   * @param {boolean} body.bot_traits.funny - Se o bot é engraçado
   * @param {boolean} body.bot_traits.professional - Se o bot é profissional
   * @param {boolean} body.bot_traits.straight - Se o bot é direto
   * @param {string} [body.additional_info] - Informações adicionais
   * @param {string} [body.deactivation_message] - Mensagem de desativação
   * @returns {Promise<object>} Configurações atualizadas do bot
   */
  async updateConfig(filterId, body) {
    const { data } = await api.post(
      `/jarbas-config?filter_id=${filterId}`,
      body
    );
    return data;
  },

  /**
   * POST /jarbas-config/reactivate
   *
   * @param {string|number} filterId - ID do projeto para reativação
   * @param {object} body - Dados do feedback
   * @param {number} body.rating - Avaliação de 1 a 5
   * @param {boolean|string} body.was_helpful - Se o bot foi útil
   * @param {string} [body.suggestions] - Sugestões de melhoria
   * @returns {Promise<object>} Objeto contendo:
   *   - config: configurações atualizadas do bot
   *   - feedback: dados do feedback registrado
   */
  async reactivateWithFeedback(filterId, body) {
    const { data } = await api.post(
      `/jarbas-config/reactivate?filter_id=${filterId}`,
      {
        ...body,
        was_helpful: body.was_helpful === "true",
      }
    );
    return data;
  },
};
