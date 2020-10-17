import axios from 'axios';

const state = {
  trackings: [],
};

const getters = {
  allTrackingData: (state) => state.trackings,
};

const actions = {
  async fetchTrackings({ commit }) {
    const response = await axios.get('/api/getall');
    commit('setTrackings', response.data);
  },
  async addRecords({ commit }, records_to_add) {
    const response = await axios.post('/api/add', records_to_add);
    commit('addTrackings', response.data);
  },
  async updateRecord({ commit }, { action, tracking }) {
    const response = await axios.post('/api/update_tracking', { action, tracking });
    commit('updateTrackings', { trackings: response.data, tracking });
  },
  async deleteRecord({ commit }, { tracking }) {
    await axios.post('/api/update_tracking', { tracking });
    commit('deleteTrackings', tracking);
  },
};

const mutations = {
  setTrackings: (state, trackings) => (state.trackings = trackings),
  addTrackings: (state, trackings) => (state.trackings = state.trackings.concat(trackings)),
  updateTrackings: (state, { trackings, tracking }) =>
    (state.trackings = state.trackings.filter((d) => d.tracking != tracking).concat(trackings)),
  deleteTrackings: (state, tracking) => (state.trackings = state.trackings.filter((d) => d.tracking != tracking)),
};

export default {
  state,
  getters,
  actions,
  mutations,
};
