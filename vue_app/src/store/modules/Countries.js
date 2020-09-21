import axios from 'axios';

const state = {
  countries: [],
};

const getters = {
  countryToCode: (state) => state.countries,
  codeToCountry: (state) => state.countries.filter((e) => e.baseentry),
};

const actions = {
  async fetchCountries({ commit }) {
    const response = await axios.get('/api/getallcountries');
    commit('setCountries', response.data);
  },
  async addRecord({ commit }, records_to_add) {
    const response = await axios.post('/api/addcountry', records_to_add);
    commit('addCountry', response.data);
  },
};

const mutations = {
  setCountries: (state, countries) => (state.countries = countries),
  addCountry: (state, countries) => (state.countries = state.countries.concat(countries)),
};

export default {
  state,
  getters,
  actions,
  mutations,
};
