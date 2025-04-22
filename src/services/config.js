import api from './base.js';

export default {
  async index () {
    const { data } = await api.get('/configs')
    return data
  }
}
