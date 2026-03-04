import api from "./base";

export default {
  /**
   * Listar tags paginadas
   * @param {Object} params - { search, parent_id, filter_id, page }
   */
  async index(params) {
    const res = await api.get("/tags", { params });
    return res.data;
  },

  /**
   * Criar nova tag
   * @param {Object} data
   */
  async store(data) {
    const res = await api.post("/tags", data);
    return res.data;
  },

  /**
   * Detalhes da tag
   * @param {number} id
   */
  async show(id) {
    const res = await api.get(`/tags/${id}`);
    return res.data;
  },

  /**
   * Atualizar tag
   * @param {number} id
   * @param {Object} data
   */
  async update(id, data) {
    const res = await api.put(`/tags/${id}`, data);
    return res.data;
  },

  /**
   * Deletar tag
   * @param {number} id
   */
  async destroy(id) {
    const res = await api.delete(`/tags/${id}`);
    return res.data;
  },

  /**
   * Vincular tag a uma entidade
   * @param {Object} data - { tag_id, taggable_id, taggable_type }
   */
  async attach(data) {
    const res = await api.post("/tags/attach", data);
    return res.data;
  },

  /**
   * Desvincular tag de uma entidade
   * @param {Object} data - { tag_id, taggable_id, taggable_type }
   */
  async detach(data) {
    const res = await api.post("/tags/detach", data);
    return res.data;
  },



  async getModelTags(params={}){
    const res = await api.get(`/tags/model`,{params:params});
    return res.data;
  },

  /**
   * Importar tags via arquivo (CSV, TXT, XLSX)
   * @param {FormData} formData
   */
  async importTags(formData) {
    const res = await api.post("/tags/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};
