import api from './base';

export default {
  /**
   * POST /v1/register/finish
   *
   * @param {object} body
   * @param {string} body.email
   * @param {string} body.password
   * @param {string} body.token
   */
  async finish (body) {
    const { data } = await api.post('/register/finish', body)
    return data;
  }
}
