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
    TrackingList,
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    filterdata: function () {
      return this.allTrackingData;
    },
  },
};
</script>

<style></style>
