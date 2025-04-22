import api from './base.js';

export default {
  async finish (body) {
    const { data } = await api.post('/recover/finish', body)
    return data
  }
}
