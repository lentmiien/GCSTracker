<template>
  <div id="app">
    <Header />
    <router-view />
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import Header from './components/Header.vue';

export default {
  name: 'app',
  components: {
    Header,
  },
  methods: mapActions(['fetchTrackings', 'fetchCountries', 'fetchShippings']),
  created() {
    this.fetchTrackings();
    this.fetchCountries();
    this.fetchShippings();
  },
};
</script>

<style>
#app {
  color: white;
  background-color: black;
}
a,
.link-color {
  color: rgb(123, 255, 233);
}
a:hover,
.link-color:hover {
  color: rgb(123, 180, 255);
}
.download {
  background-color: rgba(241, 245, 0, 0.603);
  color: black;
  font-weight: 150%;
  border-radius: 25%;
  border: 3px double black;
  padding: 3px;
}
pre {
  background-color: white;
  padding: 20px;
  border-radius: 20px;
}
.t_blank_row {
  height: 25px;
  background-color: black;
}
</style>
