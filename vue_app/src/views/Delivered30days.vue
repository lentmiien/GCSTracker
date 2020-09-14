<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>All records delivered within last 30 days</h2>
        <TrackingList :data="doneTrackings30()" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TrackingList from "../components/TrackingList.vue";

export default {
  name: "Delivered30days",
  components: {
    TrackingList,
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    doneTrackings30: function () {
      return this.allTrackingData.filter(
        (d) =>
          d.carrier != "INVALID" &&
          d.delivered &&
          d.delivereddate > Date.now() - 2592000000
      );
    },
  },
};
</script>

<style></style>
