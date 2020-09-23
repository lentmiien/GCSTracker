<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <table class="table table-dark table-striped">
          <thead style="position:sticky;top:0;background-color:#888888;">
            <tr>
              <th span="col">Country</th>
              <th span="col">EMS</th>
              <th span="col">ASP</th>
              <th span="col">SAL SP Reg.</th>
              <th span="col">SAL SP Ureg.</th>
              <th span="col">SAL Parcel</th>
              <th span="col">DHL</th>
              <th span="col">Air Parcel</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="index" v-for="(entry, index) in allShippingMethods">
              <td>{{ entry.country_name }}</td>
              <td>{{ entry.ems_averagetime > 0 ? entry.ems_averagetime : '' }}</td>
              <td>{{ entry.airsp_averagetime > 0 ? entry.airsp_averagetime : '' }}</td>
              <td>{{ entry.salspr_averagetime > 0 ? entry.salspr_averagetime : '' }}</td>
              <td>{{ entry.salspu_averagetime > 0 ? entry.salspu_averagetime : '' }}</td>
              <td>{{ entry.salp_averagetime > 0 ? entry.salp_averagetime : '' }}</td>
              <td>{{ entry.dhl_averagetime > 0 ? entry.dhl_averagetime : '' }}</td>
              <td>{{ entry.airp_averagetime > 0 ? entry.airp_averagetime : '' }}</td>
            </tr>
          </tbody>
        </table>
        <pre>{{ JSON.stringify(allShippingMethods[0], null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "ShippingRatingList",
  data() {
    return {
      shippings: [],
    };
  },
  computed: mapGetters(["allShippingMethods"]),
};
</script>

<style scoped>
.status0 {
  background-color: grey;
}
.status1 {
  background-color: green;
}
.status2 {
  background-color: yellow;
}
.status3 {
  background-color: red;
}
</style>
