import Vue from 'vue';
import Vuex from 'vuex';

import Trackings from './modules/Trackings';
import Countries from './modules/Countries';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    Trackings,
    Countries,
  },
});
