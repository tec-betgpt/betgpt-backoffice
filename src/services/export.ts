import api from "./base";
import type { HistoryData } from "@/contracts/historyExport";

interface ExportIndexParams {
  filter_id?: string | null
  page?: number
  per_page?: number
}

interface ExportIndexResponse {
  data: {
    current_page: number
    data: HistoryData[]
    last_page: number
    per_page: number
    total: number
  }
}

interface ExportDataParams {
  filter_id?: string | number | null
  type_export?: string
  target_id?: number[] | number
}

export default {
  /**
     * GET /v1/export
     *
     * @param {object} params
     * @param {string} params.filter_id
     * @param {number} params.page
     * @param {number} params.per_page

     */
  async index(params: ExportIndexParams = {}): Promise<ExportIndexResponse> {
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
   * @param {string} params.type_export
   * @param {number[]|number} [params.target_id]
   *
   */
  async exportData(params: ExportDataParams = {}) {
    const { data } = await api.post("/export", {
      filter_id: params.filter_id,
      type_export: params.type_export,
      target_id: params.target_id,
    });
    return data;
  },
};
