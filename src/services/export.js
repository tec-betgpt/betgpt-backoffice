import api from "./base";

export default {
    /**
     * GET /v1/export
     *
     * @param {object} params
     * @param {string} params.filter_id
     * @param {number} params.paginate

     */
    async index(params = {}) {
        const { data } = await api.get("/export", { params });
        return data;
    },

    /**
     * POST /v1/export
     *
     * Inicia uma exportação de dados.
     *
     * @param {Object} params
     * @param {string|number} params.filter_id
     * @param {string} [params.orderBy="id"]
     * @param {string} [params.orderDirection="asc"]
     * @param {string} params.type_export
     * @param {number[]|number} [params.target_id]
     *
     */
    async exportData(params={}){
        const { data } = await api.post("/export", {
            filter_id:params.filter_id,
            date_time:params.date_time,
            order_by:params.orderBy,
            order_direction:params.orderDirection,
            type_export:params.type_export,
            target_id:params.target_id
        });
        return data;
    }
}
