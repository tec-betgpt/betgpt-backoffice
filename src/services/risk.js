import api from "./base.js";

export default {
  async index(params = {}, config = {}) {
    const { data } = await api.get("/risk", {
      params,
      signal: config.signal,
    });

    return data;
  },
};