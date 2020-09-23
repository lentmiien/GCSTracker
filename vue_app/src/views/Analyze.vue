<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1>Input</h1>
        <form @submit="analyze">
          <label for="records">Records to analyze</label>
          <textarea class="form-control" cols="30" rows="10" v-model="records" required></textarea>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
    <div class="row" v-if="display">
      <div class="col">
        <h1>Result</h1>
        <div id="accordion">
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingOne">
              <h5 class="mb-0">
                <button
                  class="btn btn-link"
                  data-toggle="collapse"
                  data-target="#collapseOne"
                  aria-expanded="true"
                  aria-controls="collapseOne"
                >Summary</button>
              </h5>
            </div>

            <div
              id="collapseOne"
              class="collapse show"
              aria-labelledby="headingOne"
              data-parent="#accordion"
            >
              <div class="card-body">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Delivered</th>
                      <th>Shipped</th>
                      <th>Returned</th>
                      <th>Lost</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        class="delivered"
                      >{{ display.summary.delivered }} ({{ Math.round(10000*display.summary.delivered/display.summary.total_records)/100 }}%)</td>
                      <td
                        class="delayed"
                      >{{ display.summary.shipped }} ({{ Math.round(10000*display.summary.shipped/display.summary.total_records)/100 }}%)</td>
                      <td
                        class="returned"
                      >{{ display.summary.returned }} ({{ Math.round(10000*display.summary.returned/display.summary.total_records)/100 }}%)</td>
                      <td
                        class="lost"
                      >{{ display.summary.lost }} ({{ Math.round(10000*display.summary.lost/display.summary.total_records)/100 }}%)</td>
                      <td>{{ display.summary.total_records }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingTwo">
              <h5 class="mb-0">
                <button
                  class="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseTwo"
                  aria-expanded="false"
                  aria-controls="collapseTwo"
                >Times</button>
              </h5>
            </div>
            <div
              id="collapseTwo"
              class="collapse"
              aria-labelledby="headingTwo"
              data-parent="#accordion"
            >
              <div class="card-body">All packages are delivered within 100 days.</div>
            </div>
          </div>
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingThree">
              <h5 class="mb-0">
                <button
                  class="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >Status</button>
              </h5>
            </div>
            <div
              id="collapseThree"
              class="collapse"
              aria-labelledby="headingThree"
              data-parent="#accordion"
            >
              <div class="card-body">100 packages were delivered, 3 lost and 2 are still delayed.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "Analyze",
  data() {
    return {
      records: "",
      display: undefined,
    };
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    analyze(e) {
      e.preventDefault();

      // Format data to send (from "records")
      const input_data = this.records.split(/[\r\n]+/); // Split on new line characters

      // Acquire records
      const analyze_data = this.allTrackingData.filter(
        (d) => input_data.indexOf(d.tracking) >= 0
      );

      const summary = {
        delivered: 0,
        shipped: 0,
        returned: 0,
        lost: 0,
        total_records: analyze_data.length,
      };
      const times = {};
      const status = {};

      analyze_data.forEach((d) => {
        if (d.delivered) {
          if (d.delivereddate == 0) {
            if (d.status == "returned") {
              summary.returned++;
            } else {
              summary.lost++;
            }
          } else {
            summary.delivered++;
          }
        } else {
          summary.shipped++;
        }
      });

      // Process analysis
      this.display = { summary, times, status };
    },
  },
};
</script>

<style scoped>
.delivered {
  color: rgb(199, 255, 143);
}
.delayed {
  color: rgb(169, 203, 241);
}
.returned {
  color: rgb(250, 214, 115);
}
.lost {
  color: rgb(255, 97, 97);
}
</style>
