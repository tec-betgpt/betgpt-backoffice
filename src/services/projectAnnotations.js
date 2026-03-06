import api from "./base.js";

export default {
    /**
     * @param {object|any} params
     * @param {number} params.size
     * @param {number} params.page
     * @param {number} params.perPage
     * @param {Array<string>} params.search
     * @param {string} params.orderBy
     * @param {string} params.orderDirection
     * @param {string} params.filter_id
     */
    async index (params = {}) {
        const { data } = await api.get("/project-annotations", { params })
        return data
    },

    /**
     * @param {object} body
     * @param {number} body.project_id
     * @param {string} body.chart_name
     * @param {string} body.annotation
     * @param {string} body.color
     */
    async store (body = {}) {
        const { data } = await api.post("project-annotations", body)
        return data
    },

    /**
     * @param {number} id
     */
    async show (id) {
        const { data } = await api.get(`/project-annotations/${id}`)
        return data
    },

    /**
     * @param {number} id
     * @param {object} body
     * @param {string} body.chart_name
     * @param {string} body.annotation
     * @param {string} body.color
     */
    async update(id, body = {}) {
        const { data } = await api.put(`/project-annotations/${id}`, body)
        return data
    },

    /**
     * @param {number} id
     */
    async destroy(id) {
        const { data } = await api.delete(`/project-annotations/${id}`)
        return data
    },

    /**
     * @param {string} chartName
     */
    async chartName(chartName) {
        const { data } = await api.delete(`/project-annotations/chart-name/${chartName}`)
        return data
    }
}
