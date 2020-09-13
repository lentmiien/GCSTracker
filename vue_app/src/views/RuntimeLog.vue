<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Runtime log</h2>
        <p>Server started at {{ (new Date(logdata.start)).toDateString() }}.</p>
        <div id="accordion" class="accordion">
          <div
            class="card text-white bg-dark"
            :key="index"
            v-for="(data, index) in logdata.entries"
          >
            <div :id="`heading${index}`" class="card-header">
              <h2 class="mb-0">
                <button
                  class="btn btn-link link-color"
                  type="button"
                  data-toggle="collapse"
                  :data-target="`#collapse${index}`"
                  aria-expanded="false"
                  :aria-controls="`collapse${index}`"
                >{{ data.status }} ({{ (new Date(data.timestamp)).toDateString() }})</button>
              </h2>
            </div>
            <div
              class="collapse"
              :id="`collapse${index}`"
              :aria-labelledby="`heading${index}`"
              data-parent="#accordion"
            >
              <div class="card-body">
                <pre>{{ data.text }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RuntimeLog",
  data() {
    return {
      logdata: {}
    };
  },
  created() {
    axios
      .get("/api/getruntimelog")
      .then(response => (this.logdata = response.data))
      .catch(err => console.log(err));
  }
};
</script>

<style></style>
