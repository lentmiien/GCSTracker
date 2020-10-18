<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Invalid records</h2>
        <TrackingList :data="invalidTrackings()" />
        <h2>Received before shipped records</h2>
        <TrackingList :data="timetravelTrackings()" />
        <h2>Very old records (unclosed, shipped over 6 months ago)</h2>
        <TrackingList :data="oldUnclosedTrackings()" />
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
    TrackingList,
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    invalidTrackings: function () {
      return this.allTrackingData.filter((d) => d.carrier == "INVALID");
    },
    timetravelTrackings: function () {
      return this.allTrackingData.filter(
        (d) =>
          d.delivereddate < d.shippeddate &&
          d.delivered == true &&
          d.delivereddate > 1
      );
    },
    oldUnclosedTrackings: function () {
      const cutoff = Date.now() - (1000 * 60 * 60 * 24 * 30 * 6);// About 6 months
      return this.allTrackingData.filter(
        (d) =>
          cutoff > d.shippeddate &&
          d.delivered == false
      );
    },
  },
};
</script>

<style></style>
