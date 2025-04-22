import api from './base.js'

export default {
  async index(params = {}) {
    const {data} = await api.get('/active-campaign', {params})
    return data
  }
}
