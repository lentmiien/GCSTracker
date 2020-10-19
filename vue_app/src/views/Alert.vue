<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1>Label search</h1>
        <form @submit="analyzelabel">
          <label for="records">Label to analyze</label>
          <select name="records" id="records" v-model="label" required>
            <option :key="a.id" :value="a.id" v-for="a in grouplabels">
              {{ a.label }}
            </option>
          </select>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
    <div class="row" v-if="display">
      <div class="col">
        <h1>Alert</h1>
        <p>Total undelivered: {{ display.number }}</p>
        <div class="section">
          <h2>Delivery attempt, but not delivered within 3+ days</h2>
          <textarea cols="30" rows="10" class="form-control" :value="display.alerts.delivery_attempt.join('\n')" readonly></textarea>
        </div>
        <div class="section">
          <h2>No updates (more than a week)</h2>
          <textarea cols="30" rows="10" class="form-control" :value="display.alerts.no_updates.join('\n')" readonly></textarea>
        </div>
        <div class="section">
          <h2>All undelivered</h2>
          <textarea cols="30" rows="10" class="form-control" :value="display.alerts.all.join('\n')" readonly></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";

export default {
  name: "Alert",
  data() {
    return {
      label: "",
      display: undefined,
    };
  },
  computed: mapGetters(["grouplabels"]),
  methods: {
    analyzelabel(e) {
      e.preventDefault();
      // Format data to send (from "label")
      const input_data = parseInt(this.label);

      // Process analysis
      const alerts = {
        delivery_attempt: [],
        no_updates: [],
        all: [],
      };
      axios
        .get(`/api/gettrackingdatabatch?grouplabel=${input_data}`)
        .then((result) => {
          if (result.data.length > 0) {
            result.data.forEach((d) => {
              const history = d.data.length > 0 ? JSON.parse(d.data) : undefined;
              let latest = 0;
              if (history) {
                history.shipments[0].events.forEach(event => {
                  if (event.timestamp > latest) {
                    latest = event.timestamp;
                  }
                });
                if (
                  d.data.indexOf("deliv") >= 0 &&
                  (d.data.indexOf("attempt") >= 0 ||
                    d.data.indexOf("out for") >= 0) &&
                    Date.now() - latest > 1000 * 60 * 60 * 24 * 3
                ) {
                  // Has been a delivery attempt but still not delivered within 3 days
                  alerts.delivery_attempt.push(d.tracking);
                }
                if (Date.now() - latest > 1000 * 60 * 60 * 24 * 7) {
                  // No updates within last 7 days
                  alerts.no_updates.push(d.tracking);
                }
              }
              alerts.all.push(d.tracking);
            });

            // Save output
            this.display = { number: result.data.length, alerts };
          }
        })
        .catch((err) => console.log(err));
    },
  },
};
</script>

<style scoped>
.section {
  border-top: 3px double white;
  margin-top: 5px;
}
</style>