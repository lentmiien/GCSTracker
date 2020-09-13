<template>
  <div class="col card text-white bg-dark">
    <div class="card-header">
      <h2>Tracking status</h2>
    </div>
    <div class="card-body">
      <div class="card-text" v-if="status.last_tracked">
        <div>
          <b>Last tracked {{ status.last_tracked.count }} records at {{ status.last_tracked.date }}</b>
        </div>
        <br />
        <p :class="{ 'done' : status.JP_scraping_counter.done == 100 }">
          JP scraping at {{ status.JP_scraping_counter.done }}% done with {{ status.JP_scraping_counter.count }} tracked records.
          <b
            v-if="status.JP_scraping_counter.nowtracking.length > 0"
          >({{ status.JP_scraping_counter.nowtracking }})</b>
        </p>
        <p :class="{ 'done' : status.DHL_scraping_counter.done == 100 }">
          DHL scraping at {{ status.DHL_scraping_counter.done }}% done with {{ status.DHL_scraping_counter.count }} tracked records.
          <b
            v-if="status.DHL_scraping_counter.nowtracking.length > 0"
          >({{ status.DHL_scraping_counter.nowtracking }})</b>
        </p>
        <p :class="{ 'done' : status.DHL_API_counter.done == 100 }">
          DHL API at {{ status.DHL_API_counter.done }}% done with {{ status.DHL_API_counter.count }} tracked records.
          <b
            v-if="status.DHL_API_counter.nowtracking.length > 0"
          >({{ status.DHL_API_counter.nowtracking }})</b>
        </p>
        <p :class="{ 'done' : status.USPS_API_counter.done == 100 }">
          USPS API at {{ status.USPS_API_counter.done }}% done with {{ status.USPS_API_counter.count }} tracked records.
          <b
            v-if="status.USPS_API_counter.nowtracking.length > 0"
          >({{ status.USPS_API_counter.nowtracking }})</b>
        </p>
      </div>
      <a @click="updateStatus()" class="btn btn-link">Refresh</a>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TrackingStatus",
  data() {
    return {
      status: {}
    };
  },
  methods: {
    updateStatus: function() {
      axios
        .get("/api/getstatus")
        .then(result => (this.status = result.data))
        .catch(err => console.log(err));
    }
  },
  created() {
    this.updateStatus();
  }
};
</script>

<style scoped>
.done {
  color: rgb(47, 255, 64);
}
p {
  color: #afafaf;
}
</style>
