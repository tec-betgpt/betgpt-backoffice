import api from "./base.js";

export default {
    /**
     * @param {object|any} params
     * @param {string|null} params.end_date
     * @param {string|null} params.start_date
     * @param {string|null} params.chart_name
     * @param {string|null} params.resource
     * @param {string} params.filter_id
     */
    async index (params = {}) {
        const { data } = await api.get("/project-annotations", { params })
        return data
    },

    /**
     * @param {object} body
     * @param {string|null} body.resource
     * @param {number} body.project_id
     * @param {string|null} body.chart_name
     * @param {string} body.title
     * @param {string|null} body.annotation
     * @param {string} body.date
     * @param {string} body.date_end
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
     * @param {string} body.title
     * @param {string|null} body.annotation
     * @param {string} body.color
     * @param {string|null} body.date
     * @param {string|null} body.date_end
     * @param {string|null} body.chart_name
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
    },

    /**
     * @param {object|any} params
     * @param {string|null} params.end_date
     * @param {string|null} params.start_date
     * @param {string|null} params.chart_name
     * @param {string|null} params.resource
     * @param {string} params.filter_id
     * @param {number} params.page
     * @param {number} params.limit
     */
    async all(params = {}) {
        const { data } = await api.get('/project-annotations/all', { params })
        return data
    }
}
