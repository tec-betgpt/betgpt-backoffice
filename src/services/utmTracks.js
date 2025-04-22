import api from './base.js';

export default {
  async index (params = {}) {
   const { data } = await api.get('/utm-tracks', { params })
   return data
  }
}
