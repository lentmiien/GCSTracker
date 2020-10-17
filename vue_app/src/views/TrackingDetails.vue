<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Tracking details for {{ thisdata.tracking }}</h2>
        <table class="table table-dark table-striped">
          <tbody>
            <tr>
              <th>Added</th>
              <td>{{ (new Date(thisdata.addeddate)).toDateString() }}</td>
              <th>Last checked</th>
              <td>{{ thisdata.lastchecked > 0 ? (new Date(thisdata.lastchecked)).toDateString() : "Not checked..." }}</td>
            </tr>
            <tr>
              <th>Country</th>
              <td>{{ thisdata.country }}<br>
                <input class="form-control" type="text" name="country" id="country" :value="thisdata.country"></td>
              <th>Carrier</th>
              <td>{{ thisdata.carrier }}<br>
                <input class="form-control" type="text" name="carrier" id="carrier" :value="thisdata.carrier"></td>
            </tr>
            <tr>
              <th>Shipped</th>
              <td>{{ (new Date(thisdata.shippeddate)).toDateString() }}<br>
                <input class="form-control" type="date" name="shippeddate" id="shippeddate"></td>
              <th>Delivered</th>
              <td>{{ thisdata.delivereddate > 1 ? (new Date(thisdata.delivereddate)).toDateString() : thisdata.delivereddate == 1 ? "Delivered" : "Not delivered..." }}<br>
                <input class="form-control" type="date" name="delivereddate" id="delivereddate"></td>
            </tr>
            <tr>
              <th>Status</th>
              <td>{{ thisdata.status }}</td>
              <th>Done</th>
              <td>{{ thisdata.delivered }}</td>
            </tr>
          </tbody>
        </table>
        <div
          class="alert alert-dark d-flex justify-content-around"
          role="alert"
          v-if="thisdata.tracking != 'DELETED'"
        >
          <button @click="delivered()" class="btn btn-primary">Set delivered</button>
          <button @click="returned()" class="btn btn-primary">Set returned</button>
          <button @click="lost()" class="btn btn-primary">Set lost</button>
          <button @click="reset()" class="btn btn-secondary">Reset</button>
          <button @click="remove()" class="btn btn-danger">Delete</button>
        </div>
        <table class="table table-dark table-striped mt-3" v-if="trackdata">
          <thead>
            <tr>
              <th span="col">Time stamp</th>
              <th span="col">Status</th>
              <th span="col">Location</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="index" v-for="(datapoint, index) in trackdata.shipments[0].events">
              <td>{{ (new Date(datapoint.timestamp)).toDateString() }}</td>
              <td>{{ datapoint.description }}</td>
              <td>{{ typeof datapoint.location === 'string' ? datapoint.location : datapoint.location.address.addressLocality }}</td>
            </tr>
          </tbody>
        </table>
        <pre v-else>No data...</pre>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "TrackingDetails",
  data() {
    return {
      thisdata: null,
      trackdata: null,
    };
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    ...mapActions(["updateRecord", "deleteRecord"]),
    updatedata: function () {
      this.thisdata = this.allTrackingData.filter(
        (d) => d.tracking == this.$route.query.tracking
      )[0];
      axios
        .get(`/api/gettrackingdata?tracking=${this.$route.query.tracking}`)
        .then((result) => {
          if (result.data.length > 0) {
            this.trackdata = JSON.parse(result.data);
          }
        })
        .catch((err) => console.log(err));
    },
    delivered: function () {
      const delivered_date = document.getElementById('delivereddate').value;
      this.updateRecord({
        action: {
          country: document.getElementById('country').value,
          carrier: document.getElementById('carrier').value,
          shippeddate: document.getElementById('shippeddate').value,
          delivereddate: delivered_date.length > 0 ? delivered_date : '1',
          status: 'delivered',
          delivered: 1
        },
        tracking: this.thisdata.tracking,
      });
      setTimeout(this.updatedata, 1500);
    },
    returned: function () {
      this.updateRecord({
        action: {
          country: document.getElementById('country').value,
          carrier: document.getElementById('carrier').value,
          shippeddate: document.getElementById('shippeddate').value,
          delivereddate: '0',
          status: 'returned',
          delivered: 1
        },
        tracking: this.thisdata.tracking,
      });
      setTimeout(this.updatedata, 1500);
    },
    lost: function () {
      this.updateRecord({
        action: {
          country: document.getElementById('country').value,
          carrier: document.getElementById('carrier').value,
          shippeddate: document.getElementById('shippeddate').value,
          delivereddate: '0',
          status: 'lost',
          delivered: 1
        },
        tracking: this.thisdata.tracking,
      });
      setTimeout(this.updatedata, 1500);
    },
    reset: function () {
      const country_up = document.getElementById('country').value;
      const carrier_up = document.getElementById('carrier').value;
      const shippeddate_up = document.getElementById('shippeddate').value;
      const delivereddate_up = document.getElementById('delivereddate').value;
      this.updateRecord({
        action: {
          country: country_up.length > 0 ? country_up : 'JAPAN',
          carrier: carrier_up.length > 0 ? carrier_up : 'JP',
          shippeddate: shippeddate_up.length > 0 ? shippeddate_up : '0',
          delivereddate: delivereddate_up.length > 0 ? delivereddate_up : '0',
          status: 'updating...',
          delivered: 0
        },
        tracking: this.thisdata.tracking,
      });
      setTimeout(this.updatedata, 1500);
    },
    remove: function () {
      this.deleteRecord({ tracking: this.thisdata.tracking });
      this.thisdata = {
        tracking: "DELETED",
        addeddate: 0,
        lastchecked: 0,
        country: "DELETED",
        carrier: "DELETED",
        shippeddate: 0,
        delivereddate: 0,
        status: "DELETED",
        done: true,
        data: "",
      };
    },
  },
  created() {
    this.updatedata();
  },
};
</script>

<style></style>
