import axios from 'axios';

const state = {
  grouplabels: [],
};

const getters = {
  grouplabels: (state) => state.grouplabels,
};

const actions = {
  async fetchGrouplabels({ commit }) {
    const response = await axios.get('/api/getallGrouplabels');
    commit('setGrouplabels', response.data);
  },
  async addRecord({ commit }, records_to_add) {
    const response = await axios.post('/api/addgrouplabel', records_to_add);
    commit('addGrouplabel', response.data);
  },
};

const mutations = {
  setGrouplabels: (state, grouplabels) => (state.grouplabels = grouplabels),
  addGrouplabel: (state, grouplabels) => (state.grouplabels = state.grouplabels.concat(grouplabels)),
};

export default {
  state,
  getters,
  actions,
  mutations,
};
