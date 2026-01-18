import  api from './base.js';

const index = async (params) => {
  const { data } = await api.get('/conversion-definitions/conversion-analytics', { params });
  return data.data;
};

export default {
  index,
};
