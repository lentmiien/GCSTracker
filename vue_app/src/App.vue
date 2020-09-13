<template>
  <div id="app">
    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
      integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z"
      crossorigin="anonymous"
    />

    <Header />
    <router-view />

    <script
      type="application/javascript"
      src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
      integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj"
      crossorigin="anonymous"
    ></script>
    <script
      type="application/javascript"
      src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"
      integrity="sha384-9/reFTGAW83EW2RDu2S0VKaIzap3H66lZH81PoYlFhbGU+6BZp6G7niu735Sk7lN"
      crossorigin="anonymous"
    ></script>
    <script
      type="application/javascript"
      src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"
      integrity="sha384-B4gt1jrGC7Jh4AgTPSdUtOBvfO8shuf57BaghqFfPlYxofvL8/KUEfYiJOMMV+rV"
      crossorigin="anonymous"
    ></script>
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
  methods: mapActions(['fetchTrackings']),
  created() {
    this.fetchTrackings();
  },
};
</script>

<style>
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
