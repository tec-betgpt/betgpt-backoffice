import api from './base.js'

export default {
    /**
     * GET /ia/list
     *
     * Retorna a lista de chats disponíveis.
     *
     * @returns {Promise<Array<{id:number, title:string}>>}
     */
    async getListSessions() {
        const { data } = await api.get(`ia/list`)
        return data;
    },

    /**
     * GET /ia/session
     *
     * Retorna a sessõe de chat associada a um chat_id.
     *
     * @param {object} params
     * @param {number} params.chat_id - ID do chat
     * @returns {Promise<Array<{id: number, role: 'user' | 'assistant', message: string}>>}
     * */
    async getSession(params = {}) {
        const { data } = await api.get(`ia/session`, { params: params })
        return data;
    },

    /**
     * POST /ia/messages
     *
     * Envia uma mensagem (e opcionalmente um arquivo) para o chat.
     *
     * @param {Object} params - Parâmetros da requisição
     * @param {number} params.chat_id - ID do chat
     * @param {string} params.project_id
     * @param {string} params.message - Texto da mensagem
     * @param {File} [params.file] - Arquivo opcional a ser enviado (imagem, PDF, etc)
     * @param {Object} params.context
     * @returns {Promise<message:string>} - Resposta da API
     */
    async sendMessage(params = {}) {
        const formData = new FormData();
        formData.append('chat_id', params.chat_id);
        formData.append('message', params.message);
        formData.append('project_id',params.project_id)
        formData.append('date_start',params?.context.date.start)
        formData.append('date_end',params?.context.date.end)
        formData.append('url', params?.context.url)
        formData.append('context', params?.context.context)
        if (params.file) {
            formData.append('file', params.file);
        }

        const { data } = await api.post('ia/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });

        return data;
    },

    /**
     * POST /ia/create
     *
     * Cria uma nova sessão de chat.
     *
     * @returns {Promise<{id:number, title:string}>} - Nova sessão criada
     */
    async createSession(params={}) {
        const { data } = await api.post(`ia/create`,params);
        return data;
    },

    /**
     * DELETE /ia/session
     *
     * Deleta uma sessão de chat com base no chat_id.
     *
     * @param {Object} params
     * @param {number} params.chat_id - ID do chat
     * @returns {Promise<any>}
     */
    async deleteSession(params = {}) {
        const { data } = await api.delete(`ia/session`, { data: { chat_id: params.chat_id } });
        return data;
    },

    /**
     *
     * GET /ia/suggestions
     *
     * Obetem sugestoes para o usuario
     */
    async getSuggestions() {
            const { data } = await api.get(`ia/suggestions`);
            return data;
        },

    /**
     * POST /ia/feedback
     *
     * Enviar um Feedback do chat
     *
     * @param {Object} body
     * @param {number} body.chat_id - ID do chat
     * @param {number} body.score
     * @param {string} body.feedback
     * @returns {Promise<any>}
     */
    async sendFeedback(body = {}) {
        const { data } = await api.post(`ia/feedback`, body);
        return data;
    },
    /**
     *
     * @param {Object} params
     * @param {number} params.page
     * @param {number} params.per_page
     * @param {string} params.filter_id
     * @returns {Promise<any>}
     */
    async index(params={}){
        const { data } = await api.get(`ia/index`,{params:params});
        return data;
    },

    /**
     * GET /available-tools
     *
     * Retorna as ferramentas MCP disponíveis no backend.
     * @returns {Promise<Array>}
     */
    async getAvailableTools() {
        const { data } = await api.get(`ia/available-tools`);
        return data.data;
    },

    /**
     * GET /ia-settings
     *
     * Retorna as configurações atuais da IA.
     * @returns {Promise<Object>}
     */
    async getAiSettings() {
        const { data } = await api.get(`ia/ia-settings`);
        return data.data;
    },

    /**
     * POST /ia-settings
     *
     * Salva as novas configurações da IA.
     * @param {Object} settings
     * @returns {Promise<any>}
     */
    async saveAiSettings(settings) {
        const { data } = await api.post(`ia/ia-settings`, settings);
        return data;
    },

    /**
     * GET /api/v1/ai/questions
     *
     * Retorna as perguntas salvas.
     * @returns {Promise<Array>}
     */
    async getQuestions() {
        const { data } = await api.get(`ia/questions`);
        return data;
    },

    /**
     * POST /api/v1/ai/questions
     *
     * Cria uma nova pergunta salva.
     * @param {Object} params
     * @param {string} params.text
     * @returns {Promise<any>}
     */
    async createQuestion(params) {
        const { data } = await api.post(`ia/questions`, params);
        return data;
    },

    /**
     * DELETE /api/v1/ai/questions/{id}
     *
     * Deleta uma pergunta salva.
     * @param {number} id
     * @returns {Promise<any>}
     */
    async deleteQuestion(id) {
        const { data } = await api.delete(`ia/questions`,{params: {id:id}});
        return data;
    }
}
