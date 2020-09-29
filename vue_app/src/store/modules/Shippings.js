import axios from 'axios';

const state = {
  shippings: [],
};

const getters = {
  allShippingMethods: (state) => state.shippings,
};

const actions = {
  async fetchShippings({ commit }) {
    const response = await axios.get('/api/getallshippings');
    commit('setShippings', response.data);
  },
  async updateShippingRecord({ commit }, shipping) {
    const response = await axios.post('/api/updateshipping', { shipping });
    commit('updateShippings', { shippings: response.data });
  },
};

const mutations = {
  setShippings: (state, shippings) => (state.shippings = shippings),
  updateShippings: (state, { shippings }) =>
    state.shippings.forEach((d, i) => {
      if (d.country_name == shippings[0].country_name) {
        state.shippings[i].ems_available = shippings[0].ems_available;
        state.shippings[i].airsp_available = shippings[0].airsp_available;
        state.shippings[i].salspr_available = shippings[0].salspr_available;
        state.shippings[i].salspu_available = shippings[0].salspu_available;
        state.shippings[i].salp_available = shippings[0].salp_available;
        state.shippings[i].dhl_available = shippings[0].dhl_available;
        state.shippings[i].airp_available = shippings[0].airp_available;
      }
    }),
};

export default {
  state,
  getters,
  actions,
  mutations,
};
