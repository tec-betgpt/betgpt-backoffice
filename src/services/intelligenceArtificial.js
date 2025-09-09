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
     * @param {number} params.project_id
     * @param {string} params.message - Texto da mensagem
     * @param {File} [params.file] - Arquivo opcional a ser enviado (imagem, PDF, etc)
     * @returns {Promise<message:string>} - Resposta da API
     */
    async sendMessage(params = {}) {
        const formData = new FormData();
        formData.append('chat_id', params.chat_id);
        formData.append('message', params.message);
        formData.append('project_id',params.project_id)

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
    async createSession() {
        const { data } = await api.post(`ia/create`);
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
}
