<template>
  <div class="col card text-white bg-dark">
    <div class="card-header">
      <h2>Tracking status</h2>
    </div>
    <div class="card-body">
      <div class="card-text" v-if="status.jp">
        <p :class="{ done: status.jp.current == status.jp.total }">
          JP tracking at {{ status.jp.current }} of
          {{ status.jp.total }} records.
          <i>(Last: {{ status.jp.last }})</i>
        </p>
        <p :class="{ done: status.dhl.current == status.dhl.total }">
          DHL tracking at {{ status.dhl.current }} of
          {{ status.dhl.total }} records.
          <i>(Last: {{ status.dhl.last }})</i>
        </p>
        <p :class="{ done: status.usps.current == status.usps.total }">
          USPS tracking at {{ status.usps.current }} of
          {{ status.usps.total }} records.
          <i>(Last: {{ status.usps.last }})</i>
        </p>
      </div>
      <a @click="updateStatus()" class="btn btn-link">Refresh tracking</a>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TrackingStatus",
  data() {
    return {
      status: {},
    };
  },
  methods: {
    updateStatus: function () {
      axios
        .get("/api/getlog")
        .then((response) => (this.status = response.data.tracking))
        .catch((err) => console.log(err));
    },
  },
  created() {
    this.updateStatus();
  },
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
