<template>
  <div class="col card text-white bg-dark">
    <div class="card-header">
      <h2>Data status</h2>
    </div>
    <div class="card-body">
      <p class="card-text">Total records: {{ allTrackingData.length }}</p>
      <p class="card-text">
        <b>Worldwide average shipping times:</b>
        <br />
        <i>*last 30 days (Overall)</i>
        <br />
        <span>DHL: {{ dhl_avg_time(0, 30) }} days ({{dhl_avg_time(0, 9999)}} days)</span>
        <br />
        <span>EMS: {{ ems_avg_time(0, 30) }} days ({{ems_avg_time(0, 9999)}} days)</span>
        <br />
        <span>Air/SAL: {{ other_avg_time(0, 30) }} days ({{other_avg_time(0, 9999)}} days)</span>
      </p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "DataStatus",
  computed: mapGetters(["allTrackingData"]),
  methods: {
    dhl_avg_time: function(sd, ed) {
      const allTrackings = this.allTrackingData.filter(
        d => d.carrier != "INVALID"
      );
      let total_time = 0;
      let count = 0;
      const new_limit = Date.now() - 86400000 * parseInt(sd);
      const old_limit = Date.now() - 86400000 * parseInt(ed);
      allTrackings.forEach(d => {
        if (
          d.carrier == "DHL" &&
          d.shippeddate > old_limit &&
          new_limit >= d.shippeddate &&
          d.delivereddate - d.shippeddate > 0
        ) {
          total_time += (d.delivereddate - d.shippeddate) / 86400000;
          count++;
        }
      });
      return Math.round((100 * total_time) / count) / 100;
    },
    ems_avg_time: function(sd, ed) {
      const allTrackings = this.allTrackingData.filter(
        d => d.carrier != "INVALID"
      );
      let total_time = 0;
      let count = 0;
      const new_limit = Date.now() - 86400000 * parseInt(sd);
      const old_limit = Date.now() - 86400000 * parseInt(ed);
      allTrackings.forEach(d => {
        if (
          d.carrier != "DHL" &&
          d.tracking.indexOf("EM") == 0 &&
          d.shippeddate > old_limit &&
          new_limit >= d.shippeddate &&
          d.delivereddate - d.shippeddate > 0
        ) {
          total_time += (d.delivereddate - d.shippeddate) / 86400000;
          count++;
        }
      });
      return Math.round((100 * total_time) / count) / 100;
    },
    other_avg_time: function(sd, ed) {
      const allTrackings = this.allTrackingData.filter(
        d => d.carrier != "INVALID"
      );
      let total_time = 0;
      let count = 0;
      const new_limit = Date.now() - 86400000 * parseInt(sd);
      const old_limit = Date.now() - 86400000 * parseInt(ed);
      allTrackings.forEach(d => {
        if (
          d.carrier != "DHL" &&
          d.tracking.indexOf("EM") != 0 &&
          d.shippeddate > old_limit &&
          new_limit >= d.shippeddate &&
          d.delivereddate - d.shippeddate > 0
        ) {
          total_time += (d.delivereddate - d.shippeddate) / 86400000;
          count++;
        }
      });
      return Math.round((100 * total_time) / count) / 100;
    }
  }
};
</script>

<style scoped></style>
