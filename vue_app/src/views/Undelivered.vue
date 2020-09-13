<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2
          v-if="$route.query.start"
        >Undelivered records for {{ (new Date(parseInt($route.query.start))).toDateString() }} - {{ (new Date(parseInt($route.query.end))).toDateString() }}</h2>
        <h2 v-else>All undelivered records</h2>
        <p>Total records: {{ filterdata().length }}</p>
        <TrackingList :data="filterdata()" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TrackingList from "../components/TrackingList.vue";

export default {
  name: "Undelivered",
  components: {
    TrackingList
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    filterdata: function() {
      let start = 0;
      let end = Date.now();
      if (this.$route.query.start && this.$route.query.end) {
        start = parseInt(this.$route.query.start);
        end = parseInt(this.$route.query.end);
      }
      const use_data = this.allTrackingData.filter(
        d =>
          d.carrier != "INVALID" &&
          d.done == false &&
          d.shippeddate > start &&
          end > d.shippeddate
      );
      return use_data;
    }
  }
};
</script>

<style></style>
