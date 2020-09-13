<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Invalid records</h2>
        <TrackingList :data="invalidTrackings()" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TrackingList from "../components/TrackingList.vue";

export default {
  name: "Maintenance",
  components: {
    TrackingList
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    invalidTrackings: function() {
      return this.allTrackingData.filter(d => d.carrier == "INVALID");
    }
  }
};
</script>

<style></style>
