import api from './base.js'

export default {
    /**
     * GET /v1/conversion-definitions
     * Busca a lista de todas as definições de conversão.
     */
    async index () {
        const { data } = await api.get('/conversion-definitions')
        return data.data
    },

    /**
     * GET /v1/conversion-definitions/available-conditions
     * Busca a lista de tipos de condições disponíveis para construir as regras no frontend.
     */
    async availableConditions () {
        const { data } = await api.get('/conversion-definitions/available-conditions')
        return data.data
    },

    /**
     * GET /v1/conversion-definitions/segments
     *
     * @param {object} params
     * @param {string} params.find_name
     * @param {string} params.filter_id
     */
    async listSegment (params = {}) {
        const { data } = await api.get(`/conversion-definitions/segments`,{params:params})
        return data.data
    },
    /**
     * GET /v1/conversion-definitions/{id}
     * Busca uma definição de conversão específica pelo seu ID.
     *
     * @param {find} id O ID da definição de conversão.
     */
    async show (id) {
        const { data } = await api.get(`/conversion-definitions/${id}`)
        return data.data
    },

    /**
     * POST /v1/conversion-definitions
     * Cria uma nova definição de conversão.
     *
     * @param {object} payload O objeto JSON contendo os dados da nova definição.
     * @param {string} payload.name O nome da definição.
     * @param {boolean} [payload.is_primary=false] Se a conversão está ativa.
     * @param {Array} payload.condition_groups Array de grupos de condições.
     */
    async store (payload) {
        const { data } = await api.post('/conversion-definitions', payload)
        return data.data
    },

    /**
     * PUT /v1/conversion-definitions/{id}
     * Atualiza uma definição de conversão existente.
     *
     * @param {number} id O ID da definição a ser atualizada.
     * @param {object} payload O objeto JSON contendo os novos dados da definição.
     */
    async update (id, payload) {
        const { data } = await api.put(`/conversion-definitions/${id}`, payload)
        return data.data
    },

    /**
     * DELETE /v1/conversion-definitions/{id}
     * Deleta uma definição de conversão.
     *
     * @param {number} id O ID da definição a ser deletada.
     */
    async destroy (id) {
        await api.delete(`/conversion-definitions/${id}`)
    },
}