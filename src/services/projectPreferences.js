import api from './base.js';
export default {
    /**
     * GET /project-preferences
     *
     * Obtém a preferência do projeto (um registro por projeto).
     *
     * @param {object} params
     * @param {string} params.filter_id - Filtro do projeto: project_1, group_1, all
     */
    async index(params = {}) {
        const { data } = await api.get('/project-preferences', { params });
        return data;
    },

    /**
     * POST /project-preferences
     *
     * Cria ou atualiza uma preferência (firstOrCreate).
     *
     * @param {object} body
     * @param {number} body.project_id - ID do projeto
     * @param {number} body.google_analytics_group_id - ID do grupo do Google Analytics
     */
    async store(body = {}) {
        const { data } = await api.post('/project-preferences', body);
        return data;
    },

    /**
     * GET /project-preferences/{id}
     *
     * Obtém detalhes de uma preferência específica.
     *
     * @param {number} id - ID da preferência
     */
    async show(id) {
        const { data } = await api.get(`/project-preferences/${id}`);
        return data;
    },

    /**
     * PUT /project-preferences/{id}
     *
     * Atualiza uma preferência existente.
     *
     * @param {number} id - ID da preferência
     * @param {object} body
     * @param {number} body.google_analytics_group_id - ID do grupo do Google Analytics
     */
    async update(id, body = {}) {
        const { data } = await api.put(`/project-preferences/${id}`, body);
        return data;
    },

    /**
     * DELETE /project-preferences/{id}
     *
     * Exclui uma preferência.
     *
     * @param {number} id - ID da preferência
     */
    async destroy(id) {
        const { data } = await api.delete(`/project-preferences/${id}`);
        return data;
    },

    /**
     * GET /project-preferences/google-analytics-groups
     *
     * Lista os grupos do Google Analytics disponíveis para os projetos do usuário.
     *
     * @param {object} params
     * @param {string} params.filter_id - Filtro do projeto: project_1, group_1, all
     */
    async googleAnalyticsGroups(params = {}) {
        const { data } = await api.get('/project-preferences/google-analytics-groups', { params });
        return data;
    },
};