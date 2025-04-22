import api from './base';

export default {
  async finish (body) {
    const { data } = await api.post('/register/finish', body)
    return data;
  }
}
