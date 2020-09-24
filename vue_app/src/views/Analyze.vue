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
              <div class="card-body">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Delivered<br>Avg. days</th>
                      <th>Overall<br>Avg. days</th>
                      <th>In shipment<br>Avg. days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{ Math.round(display.times.delivered.totaltime_ms / display.times.delivered.number / 100 /*ms +10 after rounding */ / 60 /*sec*/ / 60 /*min*/ / 24 /*hr*/) / 10 }}</td>
                      <td>{{ Math.round((display.times.delivered.totaltime_ms + display.times.inshipment.totaltime_ms) / (display.times.delivered.number + display.times.inshipment.number) / 100 /*ms +10 after rounding */ / 60 /*sec*/ / 60 /*min*/ / 24 /*hr*/) / 10 }}</td>
                      <td>{{ Math.round(display.times.inshipment.totaltime_ms / display.times.inshipment.number / 100 /*ms +10 after rounding */ / 60 /*sec*/ / 60 /*min*/ / 24 /*hr*/) / 10 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
              <div class="card-body">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Front door delivery</th>
                      <th>Post box delivery</th>
                      <th>In person delivery</th>
                      <th>Unknown delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{ display.status.delivered.door }}</td>
                      <td>{{ display.status.delivered.post_locker }}</td>
                      <td>{{ display.status.delivered.reception_person }}</td>
                      <td>{{ display.status.delivered.unknown }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
      const times = {
        delivered: {
          number: 0,
          totaltime_ms: 0,
        },
        inshipment: {
          number: 0,
          totaltime_ms: 0,
        }
      };
      const status = {
        delivered: {
          door: 0,
          post_locker: 0,
          reception_person: 0,
          unknown: 0,
        }
      };

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
            if(d.delivereddate > 1) {
              times.delivered.number++;
              times.delivered.totaltime_ms += d.delivereddate - d.shippeddate;
            }

            // Status check
            if (d.status.indexOf('door') >= 0) {
              status.delivered.door++;
            } else if (d.status.indexOf('locker') >= 0 || d.status.indexOf('mailbox') >= 0) {
              status.delivered.post_locker++;
            } else if (d.status.indexOf('reception') >= 0 || d.status.indexOf('individual') >= 0) {
              status.delivered.reception_person++;
            } else {
              status.delivered.unknown++;
            }
          }
        } else {
          summary.shipped++;
          
          times.inshipment.number++;
          times.inshipment.totaltime_ms += Date.now() - d.shippeddate;
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
