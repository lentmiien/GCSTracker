import Vue from 'vue';
import Vuex from 'vuex';

import Trackings from './modules/Trackings';
import Countries from './modules/Countries';
import Shippings from './modules/Shippings';
import Grouplabels from './modules/Grouplabels';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    Trackings,
    Countries,
    Shippings,
    Grouplabels,
  },
});
